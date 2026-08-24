"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "./wishlist-context";
import { cn } from "@/lib/utils/cn";

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { toggle, has } = useWishlist();
  const active = has(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={cn("p-2 transition-colors hover:opacity-70", className)}
    >
      <Heart size={18} className={active ? "fill-sale text-sale" : "text-charcoal"} />
    </button>
  );
}
