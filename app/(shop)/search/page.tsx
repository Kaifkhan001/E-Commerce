import type { Metadata } from "next";
import { searchProducts } from "@/lib/shopify/search";
import { ProductCard } from "@/components/product/product-card";
import { SearchBar } from "@/components/search/search-bar";
import { AnalyticsPageEvent } from "@/components/analytics-page-event";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchProducts(query) : null;

  return (
    <div className="container-brand py-10 md:py-14">
      {query && results ? (
        <AnalyticsPageEvent event="search" params={{ search_term: query, results_count: results.products.length }} />
      ) : null}
      <h1 className="font-display mb-6 text-2xl md:text-3xl">Search</h1>
      <div className="mb-10 max-w-xl">
        <SearchBar initialQuery={query} />
      </div>

      {!query ? (
        <p className="text-charcoal-soft">Search for backpacks, totes, travel bags, and more.</p>
      ) : results && results.products.length > 0 ? (
        <>
          <p className="mb-6 text-sm text-charcoal-soft">
            {results.products.length} result{results.products.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {results.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      ) : (
        <div className="py-16 text-center">
          <p className="text-charcoal-soft">No bags found for &ldquo;{query}&rdquo;.</p>
          <p className="mt-2 text-sm text-charcoal-soft">Try a different term, or browse the full collection.</p>
        </div>
      )}
    </div>
  );
}
