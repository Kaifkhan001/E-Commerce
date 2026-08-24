"use client";

import { useEffect, useState } from "react";
import type { ProductCardData } from "@/types/shopify";
import { useWishlist } from "@/features/wishlist/wishlist-context";
import { ProductCard } from "@/components/product/product-card";
import { LinkButton } from "@/components/ui/button";

export function WishlistView() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    fetch("/api/products/by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProducts(data.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (ids.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-charcoal-soft">Your wishlist is empty.</p>
        <LinkButton href="/shop">Shop Bags</LinkButton>
      </div>
    );
  }

  if (products === null) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse bg-ivory-deep" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-charcoal-soft">Your wishlist is empty.</p>
        <LinkButton href="/shop">Shop Bags</LinkButton>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
