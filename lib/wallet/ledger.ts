import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { walletTransactions } from "@/lib/db/schema";
import { normalizeEmail } from "./money";

const POSTGRES_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; cause?: { code?: unknown } };
  return err.code === POSTGRES_UNIQUE_VIOLATION || err.cause?.code === POSTGRES_UNIQUE_VIOLATION;
}

export type InsertEarnedResult = { inserted: true; id: string } | { inserted: false; reason: "duplicate" };

/**
 * Records cashback earned on a paid order. Idempotent: if a row for this
 * order already exists (a webhook retry or duplicate delivery), the unique
 * constraint on (shopifyOrderId, type) rejects the insert and this returns
 * `{ inserted: false, reason: "duplicate" }` instead of throwing — the
 * caller should treat that as success (200), not an error.
 */
export async function insertEarnedTransaction(params: {
  email: string;
  amountPaise: number;
  shopifyOrderId: string;
  expiresAt: Date;
  note: string;
}): Promise<InsertEarnedResult> {
  try {
    const [row] = await db
      .insert(walletTransactions)
      .values({
        email: normalizeEmail(params.email),
        amountPaise: params.amountPaise,
        type: "earned",
        shopifyOrderId: params.shopifyOrderId,
        expiresAt: params.expiresAt,
        note: params.note,
      })
      .returning({ id: walletTransactions.id });
    return { inserted: true, id: row.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { inserted: false, reason: "duplicate" };
    }
    throw error;
  }
}

/** Sum of 'earned' credit ever recorded for this order (0, or the single credited amount). */
export async function getEarnedTotalForOrder(shopifyOrderId: string): Promise<number> {
  const rows = await db
    .select({ amountPaise: walletTransactions.amountPaise })
    .from(walletTransactions)
    .where(and(eq(walletTransactions.shopifyOrderId, shopifyOrderId), eq(walletTransactions.type, "earned")));
  return rows.reduce((sum, r) => sum + r.amountPaise, 0);
}

export type EarnedTransactionRecord = { id: string; email: string; amountPaise: number } | null;

/**
 * The 'earned' row for an order, if one exists. Cancellation and refund
 * handling both read the email from here rather than trusting whatever
 * email field (if any) is present on the cancellation/refund payload —
 * this guarantees a reversal always credits back against the exact same
 * wallet the original credit went to.
 */
export async function getEarnedTransactionForOrder(shopifyOrderId: string): Promise<EarnedTransactionRecord> {
  const [row] = await db
    .select({ id: walletTransactions.id, email: walletTransactions.email, amountPaise: walletTransactions.amountPaise })
    .from(walletTransactions)
    .where(and(eq(walletTransactions.shopifyOrderId, shopifyOrderId), eq(walletTransactions.type, "earned")))
    .limit(1);
  return row ?? null;
}

/** Sum of 'reversed' amount (a negative number, or 0) already recorded for this order. */
export async function getReversedTotalForOrder(shopifyOrderId: string): Promise<number> {
  const rows = await db
    .select({ amountPaise: walletTransactions.amountPaise })
    .from(walletTransactions)
    .where(and(eq(walletTransactions.shopifyOrderId, shopifyOrderId), eq(walletTransactions.type, "reversed")));
  return rows.reduce((sum, r) => sum + r.amountPaise, 0);
}

export type InsertReversalResult =
  | { inserted: true; id: string; amountPaise: number }
  | { inserted: false; reason: "nothing-to-reverse" }
  | { inserted: false; reason: "conflict" };

/**
 * Reverses up to `requestedAmountPaise` (a positive number) of previously
 * earned credit for `shopifyOrderId`, capped so the order is never reversed
 * by more than it was originally credited, even across multiple calls —
 * the remaining reversible amount is (total earned − total already
 * reversed), queried fresh before every insert.
 *
 * KNOWN LIMITATION — read before calling this a second time for one order:
 * the unique constraint on (shopifyOrderId, type) allows at most ONE
 * 'reversed' row per order, ever. That's correct and sufficient for a full
 * cancellation, or a single partial refund. A SECOND reversal event for the
 * same order (a second partial refund, or a refund arriving after a
 * cancellation already recorded one) cannot be safely written under the
 * current schema. Rather than guess whether such a case is a harmless
 * duplicate delivery of an event we already processed or a genuinely new
 * event we're about to under-process, this function returns
 * `{ reason: "conflict" }` and writes nothing — the caller must surface
 * this loudly (see the webhook route), not swallow it as a success.
 */
export async function insertReversalForOrder(params: {
  email: string;
  shopifyOrderId: string;
  requestedAmountPaise: number;
  note: string;
}): Promise<InsertReversalResult> {
  const earnedTotal = await getEarnedTotalForOrder(params.shopifyOrderId);
  const alreadyReversed = Math.abs(await getReversedTotalForOrder(params.shopifyOrderId));
  const remaining = earnedTotal - alreadyReversed;
  const amountToReverse = Math.min(params.requestedAmountPaise, remaining);

  if (amountToReverse <= 0) {
    return { inserted: false, reason: "nothing-to-reverse" };
  }

  try {
    const [row] = await db
      .insert(walletTransactions)
      .values({
        email: normalizeEmail(params.email),
        amountPaise: -amountToReverse,
        type: "reversed",
        shopifyOrderId: params.shopifyOrderId,
        note: params.note,
      })
      .returning({ id: walletTransactions.id });
    return { inserted: true, id: row.id, amountPaise: -amountToReverse };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { inserted: false, reason: "conflict" };
    }
    throw error;
  }
}

/** Reverses the full remaining credit for an order — used for orders/cancelled. */
export function reverseFullOrderCredit(params: { email: string; shopifyOrderId: string; note: string }) {
  return insertReversalForOrder({ ...params, requestedAmountPaise: Number.MAX_SAFE_INTEGER });
}
