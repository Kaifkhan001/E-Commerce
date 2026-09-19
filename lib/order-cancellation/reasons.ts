// Shared between the client-side reason <select> and server-side
// validation — the API routes re-check a submitted reason against this
// list rather than trusting whatever string the client sent.
export const CANCELLATION_REASONS = [
  { value: "ordered_by_mistake", label: "Ordered by mistake" },
  { value: "found_better_price", label: "Found a better price" },
  { value: "delivery_too_slow", label: "Delivery is too slow" },
  { value: "changed_my_mind", label: "Changed my mind" },
  { value: "other", label: "Other" },
] as const;

export type CancellationReasonValue = (typeof CANCELLATION_REASONS)[number]["value"];

export function isValidCancellationReason(value: unknown): value is CancellationReasonValue {
  return typeof value === "string" && CANCELLATION_REASONS.some((r) => r.value === value);
}

export function cancellationReasonLabel(value: string): string {
  return CANCELLATION_REASONS.find((r) => r.value === value)?.label ?? value;
}
