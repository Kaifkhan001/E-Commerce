import { cn } from "@/lib/utils/cn";
import { getExpiringCredits, getWalletBalancePaise, getWalletLedger, formatPaiseAsRupees } from "@/lib/wallet/balance";

const TYPE_LABEL: Record<string, string> = {
  earned: "Cashback earned",
  redeemed: "Redeemed",
  expired: "Expired",
  reversed: "Reversed",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export async function WalletSection({ email }: { email: string }) {
  const [balancePaise, ledger, expiring] = await Promise.all([
    getWalletBalancePaise(email),
    getWalletLedger(email),
    getExpiringCredits(email),
  ]);

  return (
    <div className="mb-8 border border-border p-5">
      <h2 className="mb-2 font-medium">Wallet</h2>
      <p className="mb-4 text-sm text-charcoal-soft">
        Cashback earned from your completed orders. This balance can&rsquo;t be used at checkout yet — spending your
        wallet balance is coming in a future update.
      </p>

      <p className="font-display text-2xl">{formatPaiseAsRupees(balancePaise)}</p>
      <p className="mb-4 text-xs text-charcoal-soft">Available balance</p>

      {expiring.length > 0 ? (
        <div className="mb-4 border border-sale/40 bg-sale/5 p-3 text-sm text-sale">
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
        <ul className="divide-y divide-border">
          {ledger.map((row) => {
            const isDebit = row.amountPaise < 0;
            return (
              <li key={row.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div>
                  <p>{row.note ?? TYPE_LABEL[row.type]}</p>
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
