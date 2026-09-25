import "server-only";
import { fetchOrderForCancellation } from "./fetch-order";
import { checkCancellationEligibility } from "./eligibility";
import {
  attemptOriginalPaymentRefund,
  pollRefundTransactionStatus,
  startOrderCancellation,
  pollJobUntilDone,
  type TransactionStatus,
} from "./cancel-order";
import { cancellationReasonLabel } from "./reasons";
import { recordRefundIssue, type RefundIssueReason } from "./issues";
import { sendOwnerCancellationNotification, sendOwnerRefundFailureAlert } from "@/lib/notifications/owner-email";
import { sendCustomerCancellationConfirmation, sendCustomerRefundIssueEmail } from "@/lib/notifications/customer-email";
import { formatMoney } from "@/lib/utils/format";
import type { CancellableOrder } from "./fetch-order";

// Orchestrates the full self-service cancellation flow — this is the ONLY
// place that decides the order of operations, so the money-safety
// invariant lives in exactly one function: a refund is always attempted
// and CONFIRMED successful before cancellation is ever attempted, for any
// order with a real captured payment. See cancel-order.ts's file header
// for the production evidence (order #1006) that makes this necessary.

export type ExecuteCancellationResult =
  | { outcome: "cancelled"; refunded: boolean }
  | { outcome: "not_found" }
  | { outcome: "already_cancelled" }
  | { outcome: "no_longer_auto_cancellable" }
  | { outcome: "ambiguous_payment_state" }
  | { outcome: "refund_failed" }
  | { outcome: "refund_timeout" }
  | { outcome: "cancel_failed_after_refund" }
  | { outcome: "cancel_mutation_failed" }
  | { outcome: "not_confirmed" };

async function recordAndAlertRefundFailure(params: {
  order: CancellableOrder;
  email: string;
  amountDisplay: string;
  reason: RefundIssueReason;
  detail: string;
  orderUntouched: boolean;
}) {
  const { order } = params;
  await recordRefundIssue({
    email: params.email,
    shopifyOrderId: order.id,
    orderName: order.name,
    amountPaise: order.capturedPaise,
    currencyCode: order.currencyCode,
    reason: params.reason,
    detail: params.detail,
  });
  await sendOwnerRefundFailureAlert({
    orderName: order.name,
    customerEmail: params.email,
    amountDisplay: params.amountDisplay,
    detail: params.detail,
    orderUntouched: params.orderUntouched,
    timestamp: new Date(),
  });
  await sendCustomerRefundIssueEmail({ email: params.email, orderName: order.name });
}

async function finishCancellation(params: {
  order: CancellableOrder;
  email: string;
  reasonLabel: string;
  amountDisplay: string;
  refunded: boolean;
}): Promise<ExecuteCancellationResult> {
  const { order } = params;
  const staffNote = `Customer self-cancelled via website. Reason: ${params.reasonLabel}`.slice(0, 255);

  const started = await startOrderCancellation({ orderId: order.id, staffNote });

  if (started.ok) {
    if (!started.alreadyDone) {
      await pollJobUntilDone(started.jobId);
    }
  }

  // Re-fetch regardless of whether the mutation call itself reported ok —
  // this is the actual source of truth for what happened, not the
  // mutation's own response.
  const after = await fetchOrderForCancellation(order.name.replace(/^#/, ""), params.email);
  const cancelled = after.found && Boolean(after.order.cancelledAt);

  if (!cancelled) {
    if (params.refunded) {
      // The worst residual state this design allows: money already moved,
      // but the order itself didn't cancel. Never silent — needs a human,
      // immediately, and the record explicitly says no further refund is
      // needed.
      await recordAndAlertRefundFailure({
        order,
        email: params.email,
        amountDisplay: params.amountDisplay,
        reason: "cancel_failed_after_refund",
        detail: started.ok
          ? "Refund succeeded but the order did not confirm as cancelled after the job completed."
          : `Refund succeeded but the cancel mutation itself failed: ${started.error}`,
        orderUntouched: false,
      });
      return { outcome: "cancel_failed_after_refund" };
    }
    return { outcome: "cancel_mutation_failed" };
  }

  await sendCustomerCancellationConfirmation({
    email: params.email,
    orderName: order.name,
    refunded: params.refunded,
    amountDisplay: params.amountDisplay,
  });
  await sendOwnerCancellationNotification({
    kind: "cancelled",
    orderName: order.name,
    customerEmail: params.email,
    reason: params.reasonLabel,
    totalDisplay: params.amountDisplay,
    timestamp: new Date(),
  });

  return { outcome: "cancelled", refunded: params.refunded };
}

export async function executeCancellation(params: {
  orderNumber: string;
  email: string;
  reason: string;
}): Promise<ExecuteCancellationResult> {
  const result = await fetchOrderForCancellation(params.orderNumber, params.email);
  if (!result.found) return { outcome: "not_found" };

  const { order } = result;
  const eligibility = checkCancellationEligibility(order);
  if (eligibility.action === "blocked") return { outcome: "already_cancelled" };
  if (eligibility.action === "request") return { outcome: "no_longer_auto_cancellable" };

  const reasonLabel = cancellationReasonLabel(params.reason);
  const amountDisplay = formatMoney({ amount: String(order.totalPaise / 100), currencyCode: order.currencyCode });

  // COD / nothing captured — no refund is owed, go straight to cancellation.
  if (order.capturedTransactions.length === 0) {
    return finishCancellation({ order, email: params.email, reasonLabel, amountDisplay, refunded: false });
  }

  // A real edge case this store's checkout has never actually produced
  // (more than one qualifying captured payment on the order) — refuse to
  // guess which one(s) to refund rather than picking arbitrarily.
  if (order.capturedTransactions.length > 1) {
    await recordAndAlertRefundFailure({
      order,
      email: params.email,
      amountDisplay,
      reason: "ambiguous_payment_state",
      detail: `Order has ${order.capturedTransactions.length} separate captured payment transactions — the automated flow only handles a single payment and refuses to guess which to refund.`,
      orderUntouched: true,
    });
    return { outcome: "ambiguous_payment_state" };
  }

  const transaction = order.capturedTransactions[0];

  // Retry safety: if a PREVIOUS attempt already refunded this order in
  // full (e.g. the refund succeeded last time but cancellation then failed
  // for some other reason), never issue a second refund for the same
  // transaction — proceed straight to cancellation instead. This is a
  // fresh, this-request fetch, so it reflects whatever Shopify's own state
  // is right now, not anything cached from an earlier attempt.
  const alreadyRefunded = order.refundedPaise >= transaction.amountPaise;

  if (!alreadyRefunded) {
    const attempt = await attemptOriginalPaymentRefund({
      orderId: order.id,
      gateway: transaction.gateway,
      parentTransactionId: transaction.id,
      amountPaise: transaction.amountPaise,
    });

    if (!attempt.ok) {
      await recordAndAlertRefundFailure({
        order,
        email: params.email,
        amountDisplay,
        reason: "refund_failed",
        detail: `refundCreate failed: ${attempt.error}`,
        orderUntouched: true,
      });
      return { outcome: "refund_failed" };
    }

    let finalStatus: TransactionStatus | "TIMEOUT" = attempt.status;
    if (finalStatus === "PENDING") {
      finalStatus = await pollRefundTransactionStatus(attempt.transactionId);
    }

    if (finalStatus === "TIMEOUT") {
      await recordAndAlertRefundFailure({
        order,
        email: params.email,
        amountDisplay,
        reason: "refund_timeout",
        detail: "Refund transaction stayed pending past the polling window — its final status is unknown.",
        orderUntouched: true,
      });
      return { outcome: "refund_timeout" };
    }
    if (finalStatus === "FAILURE") {
      await recordAndAlertRefundFailure({
        order,
        email: params.email,
        amountDisplay,
        reason: "refund_failed",
        detail: "Shopify's refund transaction resolved to FAILURE.",
        orderUntouched: true,
      });
      return { outcome: "refund_failed" };
    }
    // finalStatus === "SUCCESS" — fall through to cancellation below.
  }

  return finishCancellation({ order, email: params.email, reasonLabel, amountDisplay, refunded: true });
}
