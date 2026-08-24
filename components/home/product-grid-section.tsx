import Link from "next/link";
import type { ProductCardData } from "@/types/shopify";
import { ProductCard } from "@/components/product/product-card";

export function ProductGridSection({
  title,
  subtitle,
  products,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  products: ProductCardData[];
  viewAllHref?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="container-brand py-16 md:py-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-md text-sm text-charcoal-soft">{subtitle}</p> : null}
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm underline underline-offset-4 hover:text-sand-dark">
            View all
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
