"use client";

import Image from "next/image";
import Link from "next/link";
import type { Cart } from "@/types/shopify";
import { useCart } from "./cart-context";
import { formatMoney } from "@/lib/utils/format";
import { LinkButton } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

// Reads from the shared CartProvider (populated with `initialCart` from the
// server at the layout level) rather than the `initialCart` prop passed in
// here directly — this keeps the drawer and the full cart page from ever
// showing different totals.
export function CartPageView({ initialCart }: { initialCart: Cart | null }) {
  const { cart: contextCart, updateItem, removeItem, isPending, error } = useCart();
  const cart = contextCart ?? initialCart;

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-charcoal-soft">Your bag is empty.</p>
        <LinkButton href="/shop">Shop Bags</LinkButton>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        {error ? <p className="mb-4 text-sm text-sale">{error}</p> : null}
        <ul className="divide-y divide-border border-y border-border">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex gap-5 py-6">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-ivory-deep">
                {line.merchandise.product.featuredImage ? (
                  <Image
                    src={line.merchandise.product.featuredImage.url}
                    alt={line.merchandise.product.featuredImage.altText || line.merchandise.product.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/products/${line.merchandise.product.handle}`} className="font-medium">
                      {line.merchandise.product.title}
                    </Link>
                    {line.merchandise.selectedOptions.length > 0 && (
                      <p className="mt-1 text-sm text-charcoal-soft">
                        {line.merchandise.selectedOptions.map((o) => o.value).join(" / ")}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium">{formatMoney(line.cost.totalAmount)}</span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center border border-border">
                    <button
                      aria-label="Decrease quantity"
                      disabled={isPending}
                      onClick={() => updateItem(line.id, line.quantity - 1)}
                      className="px-3 py-1.5 hover:bg-ivory-deep disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm">{line.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      disabled={isPending}
                      onClick={() => updateItem(line.id, line.quantity + 1)}
                      className="px-3 py-1.5 hover:bg-ivory-deep disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(line.id)}
                    disabled={isPending}
                    aria-label="Remove item"
                    className="p-2 text-charcoal-soft hover:text-sale disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit border border-border p-6">
        <h2 className="font-display mb-5 text-lg">Order Summary</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-charcoal-soft">Subtotal</span>
            <span>{formatMoney(cart.cost.subtotalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal-soft">Shipping</span>
            <span className="text-charcoal-soft">Calculated at checkout</span>
          </div>
        </div>
        <div className="mt-5 flex justify-between border-t border-border pt-4 font-medium">
          <span>Total</span>
          <span>{formatMoney(cart.cost.totalAmount)}</span>
        </div>
        <LinkButton href={cart.checkoutUrl} className="mt-6 w-full">
          Proceed to Checkout
        </LinkButton>
      </aside>
    </div>
  );
}
