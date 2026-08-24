import { shopifyConfig } from "./config";

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly graphqlErrors?: unknown
  ) {
    super(message);
    this.name = "ShopifyApiError";
  }
}

type ShopifyFetchOptions<TVariables> = {
  query: string;
  variables?: TVariables;
  cache?: RequestCache;
  // Next.js revalidation window in seconds. Product/collection data doesn't
  // need to be real-time, so we default to a short revalidate window rather
  // than no-store, to keep the storefront fast.
  revalidate?: number | false;
  tags?: string[];
};

/**
 * Server-only GraphQL client for Shopify's Storefront API. Never import this
 * from a Client Component — the private/storefront token must stay on the
 * server. Throws ShopifyApiError on transport or GraphQL-level errors so
 * callers can catch a single error type.
 */
export async function shopifyFetch<TData, TVariables = Record<string, unknown>>({
  query,
  variables,
  cache,
  revalidate = 60,
  tags,
}: ShopifyFetchOptions<TVariables>): Promise<TData> {
  if (!shopifyConfig.enabled) {
    throw new ShopifyApiError(
      "shopifyFetch called while SHOPIFY_ENABLED is false. This should never happen — " +
        "callers must check shopifyConfig.enabled and use the mock data layer instead."
    );
  }

  let response: Response;
  try {
    response = await fetch(shopifyConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": shopifyConfig.storefrontToken,
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      // cache and next.revalidate are mutually exclusive in fetch options;
      // callers pass one or the other.
      ...(cache ? { cache } : { next: { revalidate, tags } }),
    });
  } catch (err) {
    throw new ShopifyApiError(
      `Network error contacting Shopify Storefront API: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  if (!response.ok) {
    throw new ShopifyApiError(
      `Shopify Storefront API returned ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const json = await response.json();

  if (json.errors) {
    throw new ShopifyApiError("Shopify Storefront API returned GraphQL errors", response.status, json.errors);
  }

  return json.data as TData;
}
