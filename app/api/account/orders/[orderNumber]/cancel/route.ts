import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isValidCancellationReason } from "@/lib/order-cancellation/reasons";
import { executeCancellation } from "@/lib/order-cancellation/execute-cancellation";

// Thin HTTP wrapper — all the actual decision-making (refund-first,
// confirm, only-then-cancel, and every failure branch) lives in
// lib/order-cancellation/execute-cancellation.ts. This route's only job is
// auth + input validation + mapping an outcome to a status code.
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

  const result = await executeCancellation({ orderNumber, email, reason });

  switch (result.outcome) {
    case "cancelled":
      return NextResponse.json({ ok: true, cancelled: true, refunded: result.refunded });
    case "not_found":
      // Same generic error whether the order doesn't exist or belongs to a
      // different email — never confirm/deny which, to a caller who isn't
      // its owner.
      return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
    case "already_cancelled":
      return NextResponse.json({ ok: false, error: "already_cancelled" }, { status: 409 });
    case "no_longer_auto_cancellable":
      // The order stopped being auto-cancellable between page load and this
      // submit (e.g. it just got fulfilled) — fail safely.
      return NextResponse.json({ ok: false, error: "no_longer_auto_cancellable" }, { status: 409 });
    case "ambiguous_payment_state":
      return NextResponse.json({ ok: false, error: "ambiguous_payment_state" }, { status: 409 });
    case "refund_failed":
      return NextResponse.json({ ok: false, error: "refund_failed" }, { status: 502 });
    case "refund_timeout":
      return NextResponse.json({ ok: false, error: "refund_timeout" }, { status: 504 });
    case "cancel_failed_after_refund":
      // Money already moved; the order itself needs manual attention. This
      // is NOT the customer's fault and NOT something a retry fixes safely
      // (a retry is fine — see execute-cancellation.ts's re-refund guard —
      // but won't necessarily resolve the underlying cancel failure), so
      // it's surfaced distinctly rather than folded into a generic error.
      return NextResponse.json({ ok: false, error: "cancel_failed_after_refund" }, { status: 500 });
    case "cancel_mutation_failed":
      return NextResponse.json({ ok: false, error: "cancellation_failed" }, { status: 502 });
    case "not_confirmed":
      return NextResponse.json({ ok: false, error: "not_confirmed" }, { status: 202 });
  }
}
