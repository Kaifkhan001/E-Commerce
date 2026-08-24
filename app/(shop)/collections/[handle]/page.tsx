import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollectionByHandle } from "@/lib/shopify/collections";
import { ProductCard } from "@/components/product/product-card";
import { AnalyticsPageEvent } from "@/components/analytics-page-event";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle);
  if (!collection) return {};
  return { title: collection.title, description: collection.description };
}

export default async function CollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle);
  if (!collection) notFound();

  return (
    <div className="container-brand py-10 md:py-14">
      <AnalyticsPageEvent event="view_collection" params={{ collection_handle: collection.handle }} />
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl">{collection.title}</h1>
        {collection.description ? <p className="mt-2 max-w-lg text-sm text-charcoal-soft">{collection.description}</p> : null}
      </div>

      {collection.products.length === 0 ? (
        <p className="py-20 text-center text-charcoal-soft">No bags in this collection yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {collection.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
