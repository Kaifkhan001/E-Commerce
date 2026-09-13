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
 * Records cashback earned on a paid order. Idempotent: an order can only be
 * paid once, so `sourceEventId` is just the order id itself — a webhook
 * retry or duplicate delivery for the same order collides with the unique
 * constraint and this returns `{ inserted: false, reason: "duplicate" }`
 * instead of throwing. The caller should treat that as success (200), not
 * an error.
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
        sourceEventId: params.shopifyOrderId,
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
  | { inserted: false; reason: "duplicate" };

/**
 * Reverses up to `requestedAmountPaise` (a positive number) of previously
 * earned credit for `shopifyOrderId`, capped so the order is never reversed
 * by more than it was originally credited, even across multiple calls —
 * the remaining reversible amount is (total earned − total already
 * reversed), queried fresh before every insert.
 *
 * `sourceEventId` must uniquely identify the EVENT causing this reversal
 * (not the order) — the refund's own GID for a partial refund, or
 * `cancel:<orderId>` for a cancellation (see `reverseFullOrderCredit`).
 * This is what lets a second, genuinely different reversal event for the
 * same order succeed instead of colliding with the first one, while a
 * retried delivery of the exact same event (same sourceEventId) still
 * collides with the unique constraint and comes back here as
 * `{ reason: "duplicate" }` — treat that as success (200), not an error,
 * exactly like a duplicate 'earned' insert.
 */
export async function insertReversalForOrder(params: {
  email: string;
  shopifyOrderId: string;
  sourceEventId: string;
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
        sourceEventId: params.sourceEventId,
        note: params.note,
      })
      .returning({ id: walletTransactions.id });
    return { inserted: true, id: row.id, amountPaise: -amountToReverse };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { inserted: false, reason: "duplicate" };
    }
    throw error;
  }
}

/**
 * Reverses the full remaining credit for an order — used for
 * orders/cancelled. An order can only be cancelled once, so the
 * cancellation event's identity is just the order id with a fixed prefix
 * (distinct from the order's own 'earned' sourceEventId, and distinct from
 * any refund GID).
 */
export function reverseFullOrderCredit(params: { email: string; shopifyOrderId: string; note: string }) {
  return insertReversalForOrder({
    ...params,
    sourceEventId: `cancel:${params.shopifyOrderId}`,
    requestedAmountPaise: Number.MAX_SAFE_INTEGER,
  });
}
