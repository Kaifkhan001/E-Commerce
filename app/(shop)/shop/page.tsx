import type { Metadata } from "next";
import { getProducts } from "@/lib/shopify/products";
import { ProductCard } from "@/components/product/product-card";
import { SortSelect } from "@/components/product/sort-select";

export const metadata: Metadata = {
  title: "Shop All Bags",
  description: "Browse the full collection of backpacks, totes, and travel bags.",
};

const SORT_OPTIONS = [
  { value: "featured", label: "Featured", sortKey: undefined, reverse: undefined },
  { value: "price-asc", label: "Price: Low to High", sortKey: "PRICE", reverse: false },
  { value: "price-desc", label: "Price: High to Low", sortKey: "PRICE", reverse: true },
  { value: "newest", label: "Newest", sortKey: "CREATED_AT", reverse: true },
] as const;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; purpose?: string; capacity?: string }>;
}) {
  const params = await searchParams;
  const sortOption = SORT_OPTIONS.find((o) => o.value === params.sort) ?? SORT_OPTIONS[0];

  const products = await getProducts({ first: 48, sortKey: sortOption.sortKey, reverse: sortOption.reverse });

  return (
    <div className="container-brand py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">All Bags</h1>
          <p className="mt-2 text-sm text-charcoal-soft">{products.length} bags</p>
        </div>
        <SortSelect basePath="/shop" />
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-charcoal-soft">No bags found. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
