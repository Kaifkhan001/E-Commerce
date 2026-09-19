import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fetchOrderForCancellation } from "@/lib/order-cancellation/fetch-order";
import { checkCancellationEligibility } from "@/lib/order-cancellation/eligibility";
import { isValidCancellationReason, cancellationReasonLabel } from "@/lib/order-cancellation/reasons";
import { recordCancellationRequest } from "@/lib/order-cancellation/requests";
import { sendOwnerCancellationNotification } from "@/lib/notifications/owner-email";
import { formatMoney } from "@/lib/utils/format";

// The fallback path for a fulfilled/partially-fulfilled order: cancels
// NOTHING in Shopify — it only records the request and emails the store
// owner. See lib/order-cancellation/eligibility.ts for why an order in
// this state is never auto-cancelled.
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
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }

  const { order } = result;
  const eligibility = checkCancellationEligibility(order);

  if (eligibility.action === "blocked") {
    return NextResponse.json({ ok: false, error: "already_cancelled" }, { status: 409 });
  }
  if (eligibility.action === "auto_cancel") {
    // Still unfulfilled — the direct cancel endpoint is the correct path,
    // and this one deliberately refuses to touch Shopify at all.
    return NextResponse.json({ ok: false, error: "use_direct_cancel" }, { status: 409 });
  }

  const reasonLabel = cancellationReasonLabel(reason);
  const recorded = await recordCancellationRequest({
    email,
    shopifyOrderId: order.id,
    orderName: order.name,
    reason: reasonLabel,
  });

  if (recorded.inserted) {
    const emailResult = await sendOwnerCancellationNotification({
      kind: "cancellation_requested",
      orderName: order.name,
      customerEmail: email,
      reason: reasonLabel,
      totalDisplay: formatMoney({ amount: String(order.totalPaise / 100), currencyCode: order.currencyCode }),
      timestamp: new Date(),
    });
    if (!emailResult.sent) {
      console.warn(`[order-cancellation] owner notification email not sent for ${order.name}: ${emailResult.reason}`);
    }
  }

  return NextResponse.json({ ok: true, requested: true });
}
