import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { getExpiringCredits, getWalletBalancePaise, getWalletLedger, formatPaiseAsRupees, type WalletLedgerRow } from "@/lib/wallet/balance";
import { resolveOrderLabels, orderNumberFromName } from "@/lib/wallet/resolve-order-labels";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

// Friendly, customer-facing description for a ledger row — deliberately
// NEVER falls back to the raw `note` column for 'earned'/'reversed' rows,
// since that column can contain an internal gid://shopify/Order/... string
// (written by app/api/webhooks/shopify/route.ts for audit purposes). If the
// order name couldn't be resolved (API unavailable, order deleted), this
// degrades to a generic label — never the raw GID. See
// lib/wallet/resolve-order-labels.ts.
function describeRow(row: WalletLedgerRow, orderLabel: string | undefined): string {
  switch (row.type) {
    case "earned":
      return orderLabel ? `5% cashback from order ${orderLabel}` : "5% cashback earned";
    case "reversed":
      return orderLabel ? `Reversed — order ${orderLabel}` : "Reversed";
    case "redeemed":
      return row.note ?? "Redeemed";
    case "expired":
      return row.note ?? "Expired";
  }
}

export async function WalletSection({ email }: { email: string }) {
  const [balancePaise, ledger, expiring] = await Promise.all([
    getWalletBalancePaise(email),
    getWalletLedger(email),
    getExpiringCredits(email),
  ]);

  const orderLabels = await resolveOrderLabels(ledger.map((row) => row.shopifyOrderId));

  return (
    <div>
      <p className="mb-4 text-sm text-charcoal-soft">
        Cashback earned from your completed orders. This balance can&rsquo;t be used at checkout yet — spending your
        wallet balance is coming in a future update.
      </p>

      <p className="font-display text-2xl">{formatPaiseAsRupees(balancePaise)}</p>
      <p className="mb-6 text-xs text-charcoal-soft">Available balance</p>

      {expiring.length > 0 ? (
        <div className="mb-6 border border-sale/40 bg-sale/5 p-3 text-sm text-sale">
          {expiring.map((credit, i) => (
            <p key={i}>
              {formatPaiseAsRupees(credit.amountPaise)} expires on {formatDate(credit.expiresAt)}
            </p>
          ))}
        </div>
      ) : null}

      {ledger.length === 0 ? (
        <p className="text-sm text-charcoal-soft">No wallet activity yet — cashback appears here after your first completed order.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {ledger.map((row) => {
            const isDebit = row.amountPaise < 0;
            const orderLabel = row.shopifyOrderId ? orderLabels.get(row.shopifyOrderId) : undefined;
            const description = describeRow(row, orderLabel);
            const href = orderLabel ? `/account/orders/${orderNumberFromName(orderLabel)}` : null;

            return (
              <li key={row.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div>
                  {href ? (
                    <Link href={href} className="text-charcoal hover:underline">
                      {description}
                    </Link>
                  ) : (
                    <p>{description}</p>
                  )}
                  <p className="text-xs text-charcoal-soft">{formatDate(row.createdAt)}</p>
                </div>
                <span className={cn("shrink-0 tabular-nums", isDebit && "text-sale")}>
                  {isDebit ? "−" : "+"}
                  {formatPaiseAsRupees(Math.abs(row.amountPaise))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
