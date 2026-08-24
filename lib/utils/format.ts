import type { Money } from "@/types/shopify";

export function formatMoney(money: Money): string {
  const amount = Number(money.amount);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: money.currencyCode,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    // Unknown currency code — fall back to a plain number with the code.
    return `${money.currencyCode} ${amount.toFixed(2)}`;
  }
}

export function discountPercent(price: Money, compareAt: Money | null | undefined): number | null {
  if (!compareAt) return null;
  const p = Number(price.amount);
  const c = Number(compareAt.amount);
  if (!c || c <= p) return null;
  return Math.round(((c - p) / c) * 100);
}
