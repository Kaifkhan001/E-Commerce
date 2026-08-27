"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProductCardData } from "@/types/shopify";
import { formatMoney, discountPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { WishlistButton } from "@/features/wishlist/wishlist-button";

export function ProductCard({ product }: { product: ProductCardData }) {
  const [hovered, setHovered] = useState(false);
  const discount = discountPercent(product.priceRange.min, product.compareAtPriceRange?.min);
  const image = hovered && product.secondaryImage ? product.secondaryImage : product.featuredImage;

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[15px] bg-ivory-deep">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-charcoal-soft text-sm">No image</div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount ? (
            <span className="bg-sale px-2.5 py-1 text-xs font-medium tracking-wide text-ivory">-{discount}%</span>
          ) : null}
          {!product.availableForSale ? (
            <span className="bg-charcoal/90 px-2.5 py-1 text-xs font-medium tracking-wide text-ivory">Sold out</span>
          ) : null}
        </div>

        <WishlistButton productId={product.id} className="absolute right-2 top-2 bg-ivory/80 backdrop-blur" />
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="text-sm text-charcoal">{product.title}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn("text-charcoal", discount && "text-sale")}>{formatMoney(product.priceRange.min)}</span>
          {product.compareAtPriceRange?.min ? (
            <span className="text-charcoal-soft/70 line-through">{formatMoney(product.compareAtPriceRange.min)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
