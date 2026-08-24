// Maps a shipping rate name (as configured in Shopify Admin → Settings →
// Shipping and delivery) to an estimated delivery window used by the order
// tracker. Keys must match those rate names exactly — update this map if
// rates are renamed or added in Shopify Admin.

export type DeliveryEstimate = { minDays: number; maxDays: number };

export const DELIVERY_ESTIMATES: Record<string, DeliveryEstimate> = {
  "Standard Shipping": { minDays: 5, maxDays: 7 },
  "Express Shipping": { minDays: 2, maxDays: 3 },
};

export const DEFAULT_ESTIMATE: DeliveryEstimate = { minDays: 4, maxDays: 6 };

export function getDeliveryEstimate(rateName: string | null | undefined): DeliveryEstimate {
  if (!rateName) return DEFAULT_ESTIMATE;
  return DELIVERY_ESTIMATES[rateName] ?? DEFAULT_ESTIMATE;
}
