import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { walletTransactions } from "@/lib/db/schema";
import { normalizeEmail, formatPaiseAsRupees } from "./money";

export { formatPaiseAsRupees };

export type WalletTransactionType = "earned" | "redeemed" | "expired" | "reversed";

export type WalletLedgerRow = {
  id: string;
  amountPaise: number;
  type: WalletTransactionType;
  shopifyOrderId: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  note: string | null;
};

/** All ledger rows for a user, newest first. Read-only — never mutate the ledger here. */
export async function getWalletLedger(email: string): Promise<WalletLedgerRow[]> {
  const normalized = normalizeEmail(email);
  return db
    .select({
      id: walletTransactions.id,
      amountPaise: walletTransactions.amountPaise,
      type: walletTransactions.type,
      shopifyOrderId: walletTransactions.shopifyOrderId,
      expiresAt: walletTransactions.expiresAt,
      createdAt: walletTransactions.createdAt,
      note: walletTransactions.note,
    })
    .from(walletTransactions)
    .where(eq(walletTransactions.email, normalized))
    .orderBy(desc(walletTransactions.createdAt));
}

/**
 * Computes a user's available (spendable) wallet balance in paise.
 *
 * This is the single source of truth for "how much does this user have."
 * There is no stored balance column anywhere — it is always the live sum of
 * ledger rows, computed here:
 *
 *   + 'earned'   rows that have NOT expired (expiresAt is null, or still in the future)
 *   + 'redeemed' rows (stored as negative amounts — none exist yet, redemption isn't built)
 *   + 'reversed' rows (stored as negative amounts — cancellations/refunds)
 *   + 'expired'  rows (stored as negative amounts, IF a future expiry-sweep job writes them)
 *   − 'earned'   rows whose expiresAt has already passed are EXCLUDED from
 *     the sum, so a credit stops being spendable the moment it expires even
 *     before any batch job gets around to writing a compensating 'expired'
 *     row for it.
 *
 * Caution for whoever eventually builds an expiry-sweep job: because this
 * function already excludes lapsed 'earned' rows on every read, a sweep job
 * writing an 'expired' compensating row for that same credit does not
 * change the computed balance (the credit was already worth 0 here) — the
 * 'expired' row at that point serves history/reporting, not arithmetic. Do
 * not write a sweep that assumes the 'earned' row is still being counted.
 */
export async function getWalletBalancePaise(email: string): Promise<number> {
  const ledger = await getWalletLedger(email);
  const now = new Date();

  return ledger.reduce((total, row) => {
    const isLapsedCredit = row.type === "earned" && row.expiresAt !== null && row.expiresAt <= now;
    if (isLapsedCredit) return total;
    return total + row.amountPaise;
  }, 0);
}

export type ExpiringCredit = {
  amountPaise: number;
  expiresAt: Date;
};

/**
 * 'earned' credits expiring within the next `withinDays` days (default 60),
 * for the "credit expiring soon" notice on /account.
 *
 * This reports the GROSS amount of each still-active earned row, not netted
 * against any later reversal — the schema doesn't link a 'reversed' row to
 * the specific 'earned' lot it offsets (that allocation problem belongs to
 * redemption, which isn't built yet), so a lot that's been partially
 * reversed will still show its original earned amount here. Acceptable for
 * a heads-up notice; would need revisiting if this feeds anything that must
 * be exact.
 */
export async function getExpiringCredits(email: string, withinDays = 60): Promise<ExpiringCredit[]> {
  const ledger = await getWalletLedger(email);
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + withinDays);

  return ledger
    .filter((row): row is WalletLedgerRow & { expiresAt: Date } => {
      if (row.type !== "earned" || row.expiresAt === null) return false;
      return row.expiresAt > now && row.expiresAt <= horizon;
    })
    .map((row) => ({ amountPaise: row.amountPaise, expiresAt: row.expiresAt }))
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
}
