import "server-only";
import { sendPlainTextEmail, type SendResult } from "./mailer";

// Customer-facing cancellation emails. We deliberately turn OFF Shopify's
// own built-in cancellation notification (notifyCustomer: false on the
// orderCancel call — see cancel-order.ts) and send our own here instead,
// AFTER confirming what actually happened. Shopify's own email fires as
// part of the same async job as the cancellation itself, before a refund
// attempted alongside it can be known to have succeeded or failed — that
// is exactly what went wrong on production order #1006 (the customer was
// told "cancelled" seconds before the refund was found to have failed).

export async function sendCustomerCancellationConfirmation(params: {
  email: string;
  orderName: string;
  refunded: boolean;
  amountDisplay: string;
}): Promise<SendResult> {
  const subject = `Your order ${params.orderName} has been cancelled`;
  const text = params.refunded
    ? [
        `Your order ${params.orderName} has been cancelled, as requested.`,
        `A refund of ${params.amountDisplay} has been issued to your original payment method. It may take a few business days to appear, depending on your bank.`,
      ].join("\n\n")
    : `Your order ${params.orderName} has been cancelled, as requested.`;

  return sendPlainTextEmail({ to: params.email, subject, text });
}

/**
 * Sent when a refund could not be confirmed and, as a result, the order was
 * deliberately left uncancelled — the customer needs to know their
 * cancellation request didn't silently vanish, and that nothing changed on
 * their order in the meantime.
 */
export async function sendCustomerRefundIssueEmail(params: { email: string; orderName: string }): Promise<SendResult> {
  const subject = `We're having trouble cancelling your order ${params.orderName}`;
  const text = [
    `We received your request to cancel order ${params.orderName}, but we ran into a problem processing your refund automatically.`,
    `Your order has NOT been cancelled and is unchanged — we didn't want to cancel it without also being able to refund you.`,
    `Our team has been notified and will follow up with you shortly to sort this out.`,
  ].join("\n\n");

  return sendPlainTextEmail({ to: params.email, subject, text });
}
