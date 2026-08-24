"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types/shopify";
import { cn } from "@/lib/utils/cn";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return <div className="aspect-square bg-ivory-deep" />;
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden bg-ivory-deep md:aspect-[4/5]">
        <Image
          src={current.url}
          alt={current.altText || title}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-square overflow-hidden border bg-ivory-deep",
                i === active ? "border-charcoal" : "border-border"
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
