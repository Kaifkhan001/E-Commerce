"use client";

import { useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/types/shopify";
import { formatMoney } from "@/lib/utils/format";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function findVariant(variants: ProductVariant[], selected: Record<string, string>): ProductVariant | undefined {
  return variants.find((v) => v.selectedOptions.every((opt) => selected[opt.name] === opt.value));
}

export function AddToCartForm({ product }: { product: Product }) {
  const { addItem, isPending, error } = useCart();
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const option of product.options) {
      initial[option.name] = option.values[0];
    }
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const variant = useMemo(() => findVariant(product.variants, selected), [product.variants, selected]);

  async function handleAddToCart() {
    if (!variant) return;
    await addItem(variant.id, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div>
      {product.options.map((option) => (
        <div key={option.name} className="mb-5">
          <p className="mb-2 text-sm font-medium">{option.name}</p>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selected[option.name] === value;
              // Determine availability of this value given the currently selected other options.
              const wouldBeVariant = findVariant(product.variants, { ...selected, [option.name]: value });
              const unavailable = wouldBeVariant ? !wouldBeVariant.availableForSale : false;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelected((s) => ({ ...s, [option.name]: value }))}
                  aria-pressed={isSelected}
                  className={cn(
                    "border px-4 py-2 text-sm transition-colors",
                    isSelected ? "border-charcoal bg-charcoal text-ivory" : "border-border hover:border-charcoal",
                    unavailable && "opacity-40"
                  )}
                >
                  {value}
                  {unavailable ? " (Sold out)" : ""}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mb-6 flex items-center gap-4">
        <p className="text-sm font-medium">Quantity</p>
        <div className="flex items-center border border-border">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 hover:bg-ivory-deep"
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-sm">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 hover:bg-ivory-deep"
          >
            +
          </button>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-sale">{error}</p> : null}

      <Button
        onClick={handleAddToCart}
        disabled={!variant || !variant.availableForSale || isPending}
        size="lg"
        className="w-full sm:w-auto"
      >
        {!variant || !variant.availableForSale
          ? "Sold Out"
          : isPending
            ? "Adding…"
            : justAdded
              ? "Added ✓"
              : `Add to Bag — ${formatMoney(variant.price)}`}
      </Button>

      {variant?.quantityAvailable != null && variant.quantityAvailable > 0 && variant.quantityAvailable <= 5 ? (
        <p className="mt-3 text-sm text-sale">Only {variant.quantityAvailable} left in stock</p>
      ) : null}
    </div>
  );
}
