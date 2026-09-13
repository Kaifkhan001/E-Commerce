// Money helpers shared across the wallet feature. Every function here is a
// pure, deterministic transformation — no I/O, no database access — so the
// arithmetic that decides how much cashback someone earns can be reasoned
// about (and tested) in isolation from webhook plumbing.
//
// Rule for this entire feature: money is always an integer number of paise.
// Never introduce a float into a money calculation — floating point cannot
// represent most decimal fractions exactly (e.g. 0.1 + 0.2 !== 0.3 in IEEE
// 754), which is unacceptable when the number represents real currency.

const CASHBACK_RATE_PERCENT = 5;
const CASHBACK_EXPIRY_MONTHS = 12;

/** Lowercases and trims an email so it can be used as a stable wallet key. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Converts a Shopify decimal money string (e.g. "1234.50", "999", "0.05")
 * into an integer number of paise, using only string/integer arithmetic —
 * never `parseFloat(value) * 100`, which can misround (e.g. 19.99 * 100
 * can land on 1998.9999999999998 in IEEE 754).
 */
export function decimalStringToPaise(value: string): number {
  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;

  const [wholeRaw, fractionRaw = ""] = unsigned.split(".");
  const whole = wholeRaw === "" ? 0 : parseInt(wholeRaw, 10);
  // Pad or truncate the fractional part to exactly 2 digits (paise).
  const fraction = parseInt((fractionRaw + "00").slice(0, 2), 10);

  if (!Number.isFinite(whole) || !Number.isFinite(fraction)) {
    throw new Error(`decimalStringToPaise: cannot parse "${value}" as a money amount`);
  }

  const paise = whole * 100 + fraction;
  return negative ? -paise : paise;
}

/**
 * 5% cashback on a product subtotal, rounded DOWN to whole paise so we
 * never credit a fraction of a paisa or, through rounding, more than the
 * stated 5%. `subtotalPaise` must already exclude shipping and tax.
 */
export function calculateCashbackPaise(subtotalPaise: number): number {
  if (subtotalPaise <= 0) return 0;
  // subtotalPaise is an integer and CASHBACK_RATE_PERCENT is a small
  // integer, so this product stays comfortably within Number's safe
  // integer range for any realistic order size — no precision loss before
  // the floor divide.
  return Math.floor((subtotalPaise * CASHBACK_RATE_PERCENT) / 100);
}

/** 12 months from `from` (defaults to now) — the expiry for an 'earned' row. */
export function cashbackExpiryDate(from: Date = new Date()): Date {
  const expires = new Date(from);
  expires.setMonth(expires.getMonth() + CASHBACK_EXPIRY_MONTHS);
  return expires;
}

/** Formats an integer paise amount as a rupee string, e.g. 150050 -> "₹1,500.50". */
export function formatPaiseAsRupees(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(rupees);
}
