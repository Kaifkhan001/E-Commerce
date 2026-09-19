import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fetchOrderForCancellation } from "@/lib/order-cancellation/fetch-order";
import { checkCancellationEligibility, determineRefundNeeded } from "@/lib/order-cancellation/eligibility";
import { startOrderCancellation, pollJobUntilDone } from "@/lib/order-cancellation/cancel-order";
import { isValidCancellationReason, cancellationReasonLabel } from "@/lib/order-cancellation/reasons";
import { sendOwnerCancellationNotification } from "@/lib/notifications/owner-email";
import { formatMoney } from "@/lib/utils/format";

// Executes an actual cancellation. Every safety check here is re-derived
// from a FRESH Shopify read taken during this exact request — the email
// match, the fulfillment status, and whether a refund is owed are never
// trusted from whatever the page happened to render with, because any of
// them can have changed between page load and this submit (see
// eligibility.ts and fetch-order.ts).
export async function POST(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const { orderNumber } = await params;

  let reason: unknown;
  try {
    const body = await request.json();
    reason = body?.reason;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (!isValidCancellationReason(reason)) {
    return NextResponse.json({ ok: false, error: "invalid_reason" }, { status: 400 });
  }

  const result = await fetchOrderForCancellation(orderNumber, email);
  if (!result.found) {
    // Same generic message whether the order doesn't exist or belongs to a
    // different email — never confirm/deny which, to a caller who isn't
    // its owner. This is the server-side re-check the UI's own filtering
    // must never be trusted in place of.
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }

  const { order } = result;
  const eligibility = checkCancellationEligibility(order);

  if (eligibility.action === "blocked") {
    return NextResponse.json({ ok: false, error: "already_cancelled" }, { status: 409 });
  }
  if (eligibility.action === "request") {
    // The order stopped being auto-cancellable between page load and this
    // submit (e.g. it just got fulfilled) — fail safely rather than
    // cancelling a fulfilled order.
    return NextResponse.json({ ok: false, error: "no_longer_auto_cancellable" }, { status: 409 });
  }

  const refund = determineRefundNeeded(order);

  const started = await startOrderCancellation({
    orderId: order.id,
    refund,
    staffNote: `Customer self-cancelled via website. Reason: ${cancellationReasonLabel(reason)}`.slice(0, 255),
  });

  if (!started.ok) {
    console.error(`[order-cancellation] orderCancel failed for ${order.name}:`, started.error);
    return NextResponse.json({ ok: false, error: "cancellation_failed" }, { status: 502 });
  }

  if (!started.alreadyDone) {
    await pollJobUntilDone(started.jobId);
  }

  // Re-fetch, independent of whether polling confirmed "done" in time —
  // this is the actual source of truth for what happened.
  const after = await fetchOrderForCancellation(orderNumber, email);
  if (!after.found || !after.order.cancelledAt) {
    console.error(`[order-cancellation] order ${order.name} not confirmed cancelled after job completion.`);
    return NextResponse.json({ ok: false, error: "not_confirmed" }, { status: 202 });
  }

  const refunded = refund && after.order.refundedPaise > 0;
  if (refund && !refunded) {
    console.warn(
      `[order-cancellation] order ${order.name} was cancelled but refund not yet reflected in totalRefundedSet.`
    );
  }

  const emailResult = await sendOwnerCancellationNotification({
    kind: "cancelled",
    orderName: order.name,
    customerEmail: email,
    reason: cancellationReasonLabel(reason),
    totalDisplay: formatMoney({ amount: String(order.totalPaise / 100), currencyCode: order.currencyCode }),
    timestamp: new Date(),
  });
  if (!emailResult.sent) {
    console.warn(`[order-cancellation] owner notification email not sent for ${order.name}: ${emailResult.reason}`);
  }

  return NextResponse.json({
    ok: true,
    cancelled: true,
    refundRequested: refund,
    refundConfirmed: refunded,
  });
}
