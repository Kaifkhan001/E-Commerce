import "server-only";
import { sendPlainTextEmail, type SendResult } from "./mailer";

// Sends store-owner notifications for order cancellations and cancellation
// requests. Best-effort throughout: a failed owner notification should
// never block the underlying action or be reported to the customer as
// their own action having failed — callers should log the return value,
// not throw it upstream.

export type OwnerNotificationParams = {
  kind: "cancelled" | "cancellation_requested";
  orderName: string;
  customerEmail: string;
  reason: string;
  totalDisplay: string;
  timestamp: Date;
};

export async function sendOwnerCancellationNotification(params: OwnerNotificationParams): Promise<SendResult> {
  const recipient = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!recipient) {
    return { sent: false, reason: "OWNER_NOTIFICATION_EMAIL is not set" };
  }

  const subject =
    params.kind === "cancelled"
      ? `Order ${params.orderName} cancelled by customer`
      : `Cancellation requested for order ${params.orderName}`;

  const actionLine =
    params.kind === "cancelled"
      ? "The customer cancelled this order themselves (it was unfulfilled, so it was cancelled automatically)."
      : "The customer asked to cancel this order. It was NOT cancelled automatically because it's already fulfilled or partially fulfilled — please follow up with them directly.";

  const text = [
    actionLine,
    "",
    `Order: ${params.orderName}`,
    `Customer email: ${params.customerEmail}`,
    `Reason given: ${params.reason}`,
    `Order total: ${params.totalDisplay}`,
    `Timestamp: ${params.timestamp.toISOString()}`,
  ].join("\n");

  return sendPlainTextEmail({ to: recipient, subject, text });
}

export type RefundFailureAlertParams = {
  orderName: string;
  customerEmail: string;
  amountDisplay: string;
  /** What actually happened — e.g. "Shopify's refund transaction failed: <error>" or "Refund did not resolve within the polling window." */
  detail: string;
  /** True if the order was left uncancelled/untouched; false if cancellation had already gone through when this was detected (see execute-cancellation.ts "cancel_failed_after_refund"). */
  orderUntouched: boolean;
  timestamp: Date;
};

/**
 * A DISTINCT, loudly-marked alert — deliberately not the same email as
 * sendOwnerCancellationNotification's "cancelled" notice, and sent instead
 * of it whenever a refund can't be confirmed. Without this, a failed
 * refund is invisible until the customer complains — see the
 * order_refund_issues table this pairs with for the durable record.
 */
export async function sendOwnerRefundFailureAlert(params: RefundFailureAlertParams): Promise<SendResult> {
  const recipient = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!recipient) {
    return { sent: false, reason: "OWNER_NOTIFICATION_EMAIL is not set" };
  }

  const subject = `ACTION NEEDED: refund failed for order ${params.orderName} — manual refund required`;

  const text = [
    "A customer's self-service cancellation could not be completed because their refund failed.",
    params.orderUntouched
      ? "The order was NOT cancelled — it is unchanged in Shopify, still paid and unfulfilled."
      : "IMPORTANT: the order WAS already cancelled in Shopify before this was detected. The customer has not been refunded.",
    "",
    `Order: ${params.orderName}`,
    `Customer email: ${params.customerEmail}`,
    `Amount owed: ${params.amountDisplay}`,
    `What happened: ${params.detail}`,
    `Timestamp: ${params.timestamp.toISOString()}`,
    "",
    "Please refund this customer manually (Shopify Admin or directly in Razorpay) and follow up with them.",
  ].join("\n");

  return sendPlainTextEmail({ to: recipient, subject, text });
}
