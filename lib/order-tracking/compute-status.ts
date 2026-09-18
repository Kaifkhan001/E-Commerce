import type { DeliveryEstimate } from "./delivery-estimates";

export type TrackingStage = "placed" | "shipped" | "out_for_delivery" | "delivered";

export type TrackingStatus = {
  stage: TrackingStage;
  isConfirmed: boolean;
  estimatedDeliveryByDate: Date;
};

export type ComputeTrackingStatusInput = {
  orderCreatedAt: Date;
  isFulfilled: boolean;
  shippingRateName: string | null;
  estimate: DeliveryEstimate;
  now?: Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Elapsed days after which an unfulfilled order is assumed "shipped" rather
// than just "placed". Exported so display code (e.g. the per-stage date
// shown in the UI) can derive a "shipped by" date consistent with this same
// threshold instead of hard-coding its own copy of it.
export const SHIPPED_AFTER_DAYS = 1;

// Pure function: no I/O, no clock reads unless `now` is omitted. Fulfillment
// status from Shopify is the only source of truth for "delivered" — the
// three earlier stages are always estimates derived from elapsed time.
export function computeTrackingStatus({
  orderCreatedAt,
  isFulfilled,
  estimate,
  now = new Date(),
}: ComputeTrackingStatusInput): TrackingStatus {
  const estimatedDeliveryByDate = new Date(orderCreatedAt.getTime() + estimate.maxDays * MS_PER_DAY);

  if (isFulfilled) {
    return { stage: "delivered", isConfirmed: true, estimatedDeliveryByDate };
  }

  const elapsedDays = (now.getTime() - orderCreatedAt.getTime()) / MS_PER_DAY;

  let stage: TrackingStage;
  if (elapsedDays >= estimate.maxDays) {
    stage = "out_for_delivery";
  } else if (elapsedDays >= SHIPPED_AFTER_DAYS) {
    stage = "shipped";
  } else {
    stage = "placed";
  }

  return { stage, isConfirmed: false, estimatedDeliveryByDate };
}
