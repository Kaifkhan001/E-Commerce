"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./cart-context";
import { formatMoney } from "@/lib/utils/format";
import { LinkButton } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/track";
import { X, Minus, Plus } from "lucide-react";

export function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateItem, removeItem, isPending } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    if (isDrawerOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      panelRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-charcoal/40" onClick={closeDrawer} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg">Your Bag {cart && cart.totalQuantity > 0 ? `(${cart.totalQuantity})` : ""}</h2>
          <button onClick={closeDrawer} aria-label="Close cart" className="p-1 hover:opacity-60">
            <X size={20} />
          </button>
        </div>

        {!cart || cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-charcoal-soft">Your bag is empty.</p>
            <LinkButton href="/shop" onClick={closeDrawer}>
              Shop Bags
            </LinkButton>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 py-4">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex gap-4 border-b border-border py-4 first:pt-0 last:border-none">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-ivory-deep">
                    {line.merchandise.product.featuredImage ? (
                      <Image
                        src={line.merchandise.product.featuredImage.url}
                        alt={line.merchandise.product.featuredImage.altText || line.merchandise.product.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link href={`/products/${line.merchandise.product.handle}`} onClick={closeDrawer} className="text-sm font-medium">
                      {line.merchandise.product.title}
                    </Link>
                    {line.merchandise.selectedOptions.length > 0 && (
                      <p className="text-xs text-charcoal-soft">
                        {line.merchandise.selectedOptions.map((o) => o.value).join(" / ")}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          aria-label="Decrease quantity"
                          disabled={isPending}
                          onClick={() => updateItem(line.id, line.quantity - 1)}
                          className="px-2 py-1 hover:bg-ivory-deep disabled:opacity-40"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm">{line.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          disabled={isPending}
                          onClick={() => updateItem(line.id, line.quantity + 1)}
                          className="px-2 py-1 hover:bg-ivory-deep disabled:opacity-40"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm">{formatMoney(line.cost.totalAmount)}</span>
                    </div>
                    <button
                      onClick={() => removeItem(line.id)}
                      disabled={isPending}
                      className="mt-1 self-start text-xs text-charcoal-soft underline underline-offset-2 hover:text-charcoal disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border px-5 py-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-charcoal-soft">Subtotal</span>
                <span className="font-medium">{formatMoney(cart.cost.subtotalAmount)}</span>
              </div>
              <p className="mb-4 text-xs text-charcoal-soft">Shipping and taxes calculated at checkout.</p>
              <LinkButton
                href={cart.checkoutUrl}
                onClick={() => trackEvent("begin_checkout", { value: cart.cost.totalAmount.amount, currency: cart.cost.totalAmount.currencyCode })}
                className="w-full"
              >
                Checkout
              </LinkButton>
              <LinkButton href="/cart" variant="secondary" className="mt-2 w-full" onClick={closeDrawer}>
                View Bag
              </LinkButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
