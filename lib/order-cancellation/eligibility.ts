import type { CancellableOrder } from "./fetch-order";

// The safety guards for self-service cancellation, as their own pure
// function so the exact same logic runs when rendering the button (page
// load) and when actually executing the action (submit) — the two must
// never drift, and the submit-time call MUST re-run this against a freshly
// fetched order (see fetch-order.ts), not whatever the page rendered with,
// since fulfillment can change in between.
//
// "auto_cancel" is only ever returned for UNFULFILLED. Every other
// fulfillment status Shopify has (FULFILLED, PARTIALLY_FULFILLED, but also
// IN_PROGRESS, ON_HOLD, SCHEDULED, PENDING_FULFILLMENT, RESTOCKED,
// REQUEST_DECLINED, OPEN) falls back to "request" rather than being
// individually enumerated — the risk being guarded against is fulfillment
// having started in any form, and an allowlist of exactly one safe value is
// far harder to get wrong than a denylist of every unsafe one.
export type CancellationEligibility =
  | { action: "auto_cancel" }
  | { action: "request" }
  | { action: "blocked"; reason: "already_cancelled" };

export function checkCancellationEligibility(order: CancellableOrder): CancellationEligibility {
  if (order.cancelledAt) {
    return { action: "blocked", reason: "already_cancelled" };
  }
  if (order.fulfillmentStatus === "UNFULFILLED") {
    return { action: "auto_cancel" };
  }
  return { action: "request" };
}

/** True when a real payment was captured through an automatic gateway and must be refunded on cancellation. */
export function determineRefundNeeded(order: CancellableOrder): boolean {
  return order.capturedPaise > 0;
}
