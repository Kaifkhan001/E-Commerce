import type { SearchResult } from "@/types/shopify";
import { shopifyConfig } from "./config";
import { shopifyFetch } from "./client";
import { SEARCH_PRODUCTS_QUERY } from "./queries";
import { getProducts, normalizeProductCard } from "./products";

export async function searchProducts(query: string, first = 24): Promise<SearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { products: [], query: trimmed };

  if (!shopifyConfig.enabled) {
    const products = await getProducts({ query: trimmed, first });
    return { products, query: trimmed };
  }

  const data = await shopifyFetch<{ search: { nodes: Parameters<typeof normalizeProductCard>[0][] } }>({
    query: SEARCH_PRODUCTS_QUERY,
    variables: { query: trimmed, first },
    // Search results change with inventory; keep this fresher than catalog browsing.
    revalidate: 30,
  });

  return { products: data.search.nodes.map(normalizeProductCard), query: trimmed };
}
