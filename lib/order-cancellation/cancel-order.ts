import "server-only";
import { shopifyAdminFetch, ShopifyAdminApiError } from "@/lib/shopify/admin-client";

// Investigated live against this store's own Admin API schema (2026-04)
// before writing this — see the project notes for the introspection used.
// Findings:
//   - orderCancel is ASYNCHRONOUS: it returns a `job { id done }`, not an
//     already-cancelled order. The order is not guaranteed cancelled the
//     instant this mutation returns — callers must poll the job (see
//     pollJobUntilDone) and then re-fetch the order to confirm, rather than
//     reporting success off the mutation response alone.
//   - Refunding is INTEGRATED into this same mutation via the optional
//     `refundMethod` argument (`{ originalPaymentMethodsRefund: true }`) —
//     there is no separate refund call to make for a full refund on
//     cancellation. Omitting `refundMethod` entirely (not passing false)
//     means "don't refund", which is what we want for COD orders where
//     nothing was ever captured.
//   - `reason` is a fixed enum (CUSTOMER/DECLINED/FRAUD/INVENTORY/STAFF/
//     OTHER) describing who/why at a coarse level for Shopify's own
//     reporting — it is not free text. The customer's actual stated reason
//     (e.g. "found better price") goes in `staffNote` instead, which is
//     plain text up to 255 chars, visible to store staff only.
const ORDER_CANCEL_MUTATION = `
  mutation OrderCancel(
    $orderId: ID!
    $reason: OrderCancelReason!
    $restock: Boolean!
    $notifyCustomer: Boolean
    $refundMethod: OrderCancelRefundMethodInput
    $staffNote: String
  ) {
    orderCancel(
      orderId: $orderId
      reason: $reason
      restock: $restock
      notifyCustomer: $notifyCustomer
      refundMethod: $refundMethod
      staffNote: $staffNote
    ) {
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

export type StartCancellationResult =
  | { ok: true; jobId: string; alreadyDone: boolean }
  | { ok: false; error: string };

export async function startOrderCancellation(params: {
  orderId: string;
  refund: boolean;
  staffNote: string;
}): Promise<StartCancellationResult> {
  try {
    const data = await shopifyAdminFetch<OrderCancelResponse>(ORDER_CANCEL_MUTATION, {
      orderId: params.orderId,
      reason: "CUSTOMER",
      restock: true,
      notifyCustomer: true,
      staffNote: params.staffNote,
      ...(params.refund ? { refundMethod: { originalPaymentMethodsRefund: true } } : {}),
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls Shopify's async job until it reports done, or gives up after
 * `maxAttempts`. Returns false on timeout — this is NOT a failure signal by
 * itself, just "we couldn't confirm within our budget"; the caller still
 * re-fetches the order afterwards to determine the real outcome either way.
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
