import Link from "next/link";
import { getWalletBalancePaise, formatPaiseAsRupees } from "@/lib/wallet/balance";
import { listOrdersForEmail } from "@/lib/order-tracking/list-orders";
import { formatMoney } from "@/lib/utils/format";

// Brief hub-level summary — the full balance history lives on
// /account/wallet, the full order list on /account/orders. This is
// deliberately lightweight: one headline number per card, linking through.
export async function AccountSummary({ email }: { email: string }) {
  const [balancePaise, orderHistory] = await Promise.all([getWalletBalancePaise(email), listOrdersForEmail(email)]);

  const mostRecentOrder = orderHistory.ok ? (orderHistory.orders[0] ?? null) : null;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2">
      <Link href="/account/wallet" className="block border border-border p-5 transition-colors hover:border-charcoal">
        <h2 className="mb-2 font-medium">Wallet</h2>
        <p className="font-display text-2xl text-charcoal">{formatPaiseAsRupees(balancePaise)}</p>
        <p className="mt-1 text-xs text-charcoal-soft">Available balance — can&rsquo;t be spent yet</p>
      </Link>

      <Link href="/account/orders" className="block border border-border p-5 transition-colors hover:border-charcoal">
        <h2 className="mb-2 font-medium">Orders</h2>
        {!orderHistory.ok ? (
          <p className="text-sm text-charcoal-soft">Orders aren&rsquo;t available right now.</p>
        ) : mostRecentOrder ? (
          <>
            <p className="text-charcoal">{mostRecentOrder.name}</p>
            <p className="mt-1 text-xs text-charcoal-soft">{formatMoney(mostRecentOrder.total)} · most recent order</p>
          </>
        ) : (
          <p className="text-sm text-charcoal-soft">No orders yet</p>
        )}
      </Link>
    </div>
  );
}
