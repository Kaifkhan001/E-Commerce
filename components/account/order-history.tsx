import Link from "next/link";
import Image from "next/image";
import { listOrdersForEmail, type OrderSummary } from "@/lib/order-tracking/list-orders";
import { formatMoney } from "@/lib/utils/format";
import { LinkButton } from "@/components/ui/button";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

// Shopify's status enums are SCREAMING_SNAKE_CASE (e.g. "PARTIALLY_FULFILLED") — title-case them for display.
function statusLabel(status: string | null): string {
  if (!status) return "—";
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export async function OrderHistory({ email }: { email: string }) {
  const result = await listOrdersForEmail(email);

  if (!result.ok) {
    return (
      <div className="border border-border p-5">
        <p className="text-sm text-charcoal-soft">
          {result.reason === "not_configured"
            ? "Order history isn't available right now."
            : "We couldn't load your orders right now. Please try again shortly."}
        </p>
      </div>
    );
  }

  if (result.orders.length === 0) {
    return (
      <div className="border border-border p-5">
        <p className="mb-4 text-sm text-charcoal-soft">You haven&rsquo;t placed any orders yet.</p>
        <LinkButton href="/shop" size="sm">
          Shop Bags
        </LinkButton>
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-border border-y border-border">
        {result.orders.map((order) => (
          <OrderRow key={order.name} order={order} />
        ))}
      </ul>
      {result.orders.length >= result.limit ? (
        <p className="mt-4 text-xs text-charcoal-soft">Showing your {result.limit} most recent orders.</p>
      ) : null}
    </div>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  const orderNumber = order.name.replace(/^#/, "");

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <Link href={`/account/orders/${orderNumber}`} className="block">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-sm font-medium text-charcoal">{order.name}</span>
            <span className="ml-2 text-xs text-charcoal-soft">{formatDate(order.date)}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="border border-border px-2 py-0.5 text-charcoal-soft">{statusLabel(order.financialStatus)}</span>
            <span className="border border-border px-2 py-0.5 text-charcoal-soft">{statusLabel(order.fulfillmentStatus)}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {order.items.slice(0, 3).map((item, i) => (
              <div key={i} className="relative h-12 w-11 shrink-0 overflow-hidden rounded-[15px] border border-ivory bg-ivory-deep">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.imageAlt || item.title} fill sizes="44px" className="object-cover" />
                ) : null}
              </div>
            ))}
          </div>
          <p className="flex-1 truncate text-sm text-charcoal-soft">{order.items.map((item) => item.title).join(", ")}</p>
          <p className="shrink-0 text-sm font-medium text-charcoal">{formatMoney(order.total)}</p>
        </div>
      </Link>
    </li>
  );
}
