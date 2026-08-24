import type { Collection, ProductImage } from "@/types/shopify";
import { shopifyConfig } from "./config";
import { shopifyFetch } from "./client";
import { COLLECTIONS_QUERY, COLLECTION_BY_HANDLE_QUERY } from "./queries";
import { mockDb } from "./mock-data";
import { normalizeProductCard } from "./products";

function normalizeImage(img: ProductImage | null | undefined): ProductImage | null {
  if (!img) return null;
  return { url: img.url, altText: img.altText ?? null, width: img.width, height: img.height };
}

export async function getCollections(): Promise<Pick<Collection, "id" | "handle" | "title" | "description" | "image">[]> {
  if (!shopifyConfig.enabled) {
    return mockDb.collections.map(({ id, handle, title, description, image }) => ({ id, handle, title, description, image }));
  }

  const data = await shopifyFetch<{
    collections: { nodes: { id: string; handle: string; title: string; description: string; image: ProductImage | null }[] };
  }>({ query: COLLECTIONS_QUERY, variables: { first: 20 }, tags: ["collections"] });

  return data.collections.nodes.map((c) => ({ ...c, image: normalizeImage(c.image) }));
}

export async function getCollectionByHandle(handle: string, opts: { first?: number } = {}): Promise<Collection | null> {
  const { first = 24 } = opts;

  if (!shopifyConfig.enabled) {
    return mockDb.collections.find((c) => c.handle === handle) ?? null;
  }

  const data = await shopifyFetch<{
    collection: {
      id: string;
      handle: string;
      title: string;
      description: string;
      image: ProductImage | null;
      products: { nodes: Parameters<typeof normalizeProductCard>[0][] };
    } | null;
  }>({
    query: COLLECTION_BY_HANDLE_QUERY,
    variables: { handle, first },
    tags: [`collection:${handle}`],
  });

  if (!data.collection) return null;

  const raw = data.collection;
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    image: normalizeImage(raw.image),
    products: raw.products.nodes.map(normalizeProductCard),
  };
}
