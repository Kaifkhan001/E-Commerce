import "server-only";
import { shopifyAdminFetch, ShopifyAdminApiError } from "@/lib/shopify/admin-client";

// Investigated live against this store's own Admin API schema (2026-04),
// and against a REAL failed refund on production order #1006, before
// writing this. Findings that shaped this file's design:
//
//   - orderCancel's own bundled `refundMethod` argument is NOT safe to rely
//     on for "only cancel if the refund worked": cancellation and the
//     refund attempt are ONE async job, and cancellation (and inventory
//     restock) commits regardless of whether the refund transaction
//     ultimately succeeds. Real evidence: order #1006 shows `cancelledAt`
//     set and stock restocked, while its REFUND transaction shows
//     `status: FAILURE, errorCode: PROCESSING_ERROR` — created ~2 seconds
//     AFTER the mutation's job reported done, with zero indication of the
//     problem in `orderCancelUserErrors`. Synchronous error-checking on
//     that mutation can never catch this class of failure — the failure
//     doesn't exist yet at the moment the mutation responds.
//   - There is no webhook for refund failure (only REFUNDS_CREATE, which
//     fires when a Refund *record* is created — which happens even when
//     the underlying transaction fails). Polling the transaction's own
//     status directly is the only reliable detection method.
//   - Shopify's separate `refundCreate` mutation lets us target a specific
//     original transaction by id for an exact amount, independent of
//     cancellation entirely. This is what makes "refund first, only cancel
//     if confirmed" (see execute-cancellation.ts) possible: refund via
//     refundCreate, poll the resulting transaction until it resolves, and
//     only call orderCancel — with NO refundMethod, since the refund
//     already happened separately — once success is confirmed.
//   - notifyCustomer is always false on the cancel call here: Shopify's own
//     cancellation email fires as part of the same async job, before we
//     can know the real outcome (in the #1006 failure, it went out BEFORE
//     the refund failure was even detectable). All customer communication
//     is sent by us, after we've confirmed what actually happened — see
//     lib/notifications/customer-email.ts.

const REFUND_CREATE_MUTATION = `
  mutation RefundCreate($input: RefundInput!) {
    refundCreate(input: $input) {
      refund {
        id
        transactions(first: 5) {
          nodes {
            id
            status
            kind
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type RefundCreateResponse = {
  refundCreate: {
    refund: { id: string; transactions: { nodes: { id: string; status: string; kind: string }[] } } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

export type TransactionStatus = "SUCCESS" | "FAILURE" | "PENDING";

export type RefundAttemptResult =
  | { ok: true; refundId: string; transactionId: string; status: TransactionStatus }
  | { ok: false; error: string };

function normalizeStatus(status: string): TransactionStatus {
  // ERROR/UNKNOWN/AWAITING_RESPONSE are all "not a confirmed success" —
  // treated the same as FAILURE by callers (see execute-cancellation.ts):
  // an ambiguous outcome must never be treated as success.
  if (status === "SUCCESS") return "SUCCESS";
  if (status === "PENDING") return "PENDING";
  return "FAILURE";
}

/**
 * Issues a refund for a SPECIFIC previously-captured transaction, for its
 * exact amount — never a recomputed subtotal/shipping breakdown, since
 * refunding the literal amount that was literally charged is
 * correct-by-construction and sidesteps that class of bug entirely.
 */
export async function attemptOriginalPaymentRefund(params: {
  orderId: string;
  gateway: string;
  parentTransactionId: string;
  amountPaise: number;
}): Promise<RefundAttemptResult> {
  try {
    const data = await shopifyAdminFetch<RefundCreateResponse>(REFUND_CREATE_MUTATION, {
      input: {
        orderId: params.orderId,
        notify: false,
        transactions: [
          {
            orderId: params.orderId,
            gateway: params.gateway,
            kind: "REFUND",
            parentId: params.parentTransactionId,
            amount: (params.amountPaise / 100).toFixed(2),
          },
        ],
      },
    });

    const { refund, userErrors } = data.refundCreate;
    if (userErrors.length > 0) {
      return { ok: false, error: userErrors.map((e) => e.message).join("; ") };
    }
    if (!refund) {
      return { ok: false, error: "Shopify did not return a refund object." };
    }
    const transaction = refund.transactions.nodes.find((t) => t.kind === "REFUND") ?? refund.transactions.nodes[0];
    if (!transaction) {
      return { ok: false, error: "Refund was created but Shopify returned no transaction for it." };
    }

    return { ok: true, refundId: refund.id, transactionId: transaction.id, status: normalizeStatus(transaction.status) };
  } catch (err) {
    const message = err instanceof ShopifyAdminApiError ? err.message : err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

const TRANSACTION_STATUS_QUERY = `
  query TransactionStatus($id: ID!) {
    node(id: $id) {
      ... on OrderTransaction {
        status
        errorCode
      }
    }
  }
`;

type TransactionStatusResponse = { node: { status: string; errorCode: string | null } | null };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls a refund transaction until it leaves PENDING, or gives up after
 * the budget is exhausted. A timeout is NEVER treated as success — it is
 * returned as its own state so the caller fails exactly as safely as an
 * explicit FAILURE (see execute-cancellation.ts): an indefinitely-pending
 * refund must never fall through to "probably fine."
 */
export async function pollRefundTransactionStatus(
  transactionId: string,
  maxAttempts = 8,
  intervalMs = 1500
): Promise<TransactionStatus | "TIMEOUT"> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const data = await shopifyAdminFetch<TransactionStatusResponse>(TRANSACTION_STATUS_QUERY, { id: transactionId });
    const status = data.node?.status;
    if (!status) return "TIMEOUT";
    const normalized = normalizeStatus(status);
    if (normalized !== "PENDING") return normalized;
    await sleep(intervalMs);
  }
  return "TIMEOUT";
}

const ORDER_CANCEL_MUTATION = `
  mutation OrderCancel($orderId: ID!, $reason: OrderCancelReason!, $restock: Boolean!, $staffNote: String) {
    orderCancel(orderId: $orderId, reason: $reason, restock: $restock, notifyCustomer: false, staffNote: $staffNote) {
      job {
        id
        done
      }
      orderCancelUserErrors {
        field
        message
        code
      }
    }
  }
`;

type OrderCancelResponse = {
  orderCancel: {
    job: { id: string; done: boolean } | null;
    orderCancelUserErrors: { field: string[] | null; message: string; code: string | null }[];
  };
};

export type StartCancellationResult = { ok: true; jobId: string; alreadyDone: boolean } | { ok: false; error: string };

/**
 * Cancels the order ONLY — never bundles a refund (see file header for
 * why). Call this only after any owed refund has already been confirmed
 * successful, or after confirming none was owed.
 */
export async function startOrderCancellation(params: { orderId: string; staffNote: string }): Promise<StartCancellationResult> {
  try {
    const data = await shopifyAdminFetch<OrderCancelResponse>(ORDER_CANCEL_MUTATION, {
      orderId: params.orderId,
      reason: "CUSTOMER",
      restock: true,
      staffNote: params.staffNote,
    });

    const { job, orderCancelUserErrors } = data.orderCancel;

    if (orderCancelUserErrors.length > 0) {
      return { ok: false, error: orderCancelUserErrors.map((e) => e.message).join("; ") };
    }
    if (!job) {
      return { ok: false, error: "Shopify did not return a job for this cancellation." };
    }

    return { ok: true, jobId: job.id, alreadyDone: job.done };
  } catch (err) {
    const message = err instanceof ShopifyAdminApiError ? err.message : err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

const JOB_QUERY = `
  query PollJob($id: ID!) {
    job(id: $id) {
      id
      done
    }
  }
`;

type JobResponse = { job: { id: string; done: boolean } | null };

/**
 * Polls Shopify's async cancellation job until it reports done, or gives
 * up after `maxAttempts`. Returns false on timeout — this is NOT a failure
 * signal by itself, just "we couldn't confirm within our budget"; the
 * caller still re-fetches the order afterwards to determine the real
 * outcome either way.
 */
export async function pollJobUntilDone(jobId: string, maxAttempts = 10, intervalMs = 1000): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const data = await shopifyAdminFetch<JobResponse>(JOB_QUERY, { id: jobId });
    if (data.job?.done) {
      return true;
    }
    await sleep(intervalMs);
  }
  return false;
}
