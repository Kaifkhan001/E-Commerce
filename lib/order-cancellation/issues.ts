import "server-only";
import { db } from "@/lib/db";
import { orderRefundIssues } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/wallet/money";

export type RefundIssueReason = "refund_failed" | "refund_timeout" | "cancel_failed_after_refund" | "ambiguous_payment_state";

/**
 * The durable record that a customer's money is unresolved and needs a
 * human — see the schema comment on order_refund_issues for why this
 * exists (no webhook or other Shopify-side trace catches this failure
 * class). Never throws on its own account beyond a real DB error; this is
 * called from the failure path of a cancellation attempt, so a second
 * failure here should surface (loudly, via logs) rather than be swallowed,
 * but must never be allowed to mask the original refund problem from the
 * customer/owner-facing responses that already happened by the time this
 * runs.
 */
export async function recordRefundIssue(params: {
  email: string;
  shopifyOrderId: string;
  orderName: string;
  amountPaise: number;
  currencyCode: string;
  reason: RefundIssueReason;
  detail?: string;
}): Promise<void> {
  await db.insert(orderRefundIssues).values({
    email: normalizeEmail(params.email),
    shopifyOrderId: params.shopifyOrderId,
    orderName: params.orderName,
    amountPaise: params.amountPaise,
    currencyCode: params.currencyCode,
    reason: params.reason,
    detail: params.detail ?? null,
  });
}
