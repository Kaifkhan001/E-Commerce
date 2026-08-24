import type { BagSpecs, Product, ProductCardData, ProductImage } from "@/types/shopify";
import { shopifyConfig } from "./config";
import { shopifyFetch } from "./client";
import { PRODUCTS_QUERY, PRODUCT_BY_HANDLE_QUERY } from "./queries";
import { mockDb } from "./mock-data";

function parseMetafieldList(raw: string | null | undefined): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    // Metafield may be stored as a comma-separated string instead of a list type.
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function normalizeSpecs(raw: Record<string, { value: string } | null>): BagSpecs {
  return {
    capacityLiters: raw.capacityLiters?.value ? Number(raw.capacityLiters.value) : undefined,
    material: raw.material?.value || undefined,
    weightGrams: raw.weightGrams?.value ? Number(raw.weightGrams.value) : undefined,
    dimensions: raw.dimensions?.value || undefined,
    laptopCompatibility: raw.laptopCompatibility?.value || undefined,
    waterResistance: raw.waterResistance?.value || undefined,
    care: raw.care?.value || undefined,
    warranty: raw.warranty?.value || undefined,
    features: parseMetafieldList(raw.features?.value),
    useCases: parseMetafieldList(raw.useCases?.value),
  };
}

function normalizeImage(img: ProductImage | null | undefined): ProductImage | null {
  if (!img) return null;
  return { url: img.url, altText: img.altText ?? null, width: img.width, height: img.height };
}

export function normalizeProductCard(node: {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  tags: string[];
  featuredImage: ProductImage | null;
  images: { nodes: ProductImage[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string }; maxVariantPrice: { amount: string; currencyCode: string } };
  compareAtPriceRange: { minVariantPrice: { amount: string; currencyCode: string }; maxVariantPrice: { amount: string; currencyCode: string } } | null;
}): ProductCardData {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    availableForSale: node.availableForSale,
    tags: node.tags,
    featuredImage: normalizeImage(node.featuredImage),
    secondaryImage: normalizeImage(node.images?.nodes?.[1]),
    priceRange: { min: node.priceRange.minVariantPrice, max: node.priceRange.maxVariantPrice },
    compareAtPriceRange: node.compareAtPriceRange
      ? { min: node.compareAtPriceRange.minVariantPrice, max: node.compareAtPriceRange.maxVariantPrice }
      : null,
  };
}

export async function getProducts(opts: { first?: number; sortKey?: string; reverse?: boolean; query?: string } = {}): Promise<ProductCardData[]> {
  const { first = 24, sortKey, reverse, query } = opts;

  if (!shopifyConfig.enabled) {
    let items = mockDb.products;
    if (query) {
      const q = query.toLowerCase();
      items = items.filter((p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)));
    }
    return items.slice(0, first).map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      featuredImage: p.featuredImage,
      secondaryImage: p.images[1] ?? null,
      priceRange: p.priceRange,
      compareAtPriceRange: p.compareAtPriceRange,
      availableForSale: p.availableForSale,
      tags: p.tags,
    }));
  }

  const data = await shopifyFetch<{
    products: { nodes: Parameters<typeof normalizeProductCard>[0][] };
  }>({
    query: PRODUCTS_QUERY,
    variables: { first, sortKey, reverse, query },
    tags: ["products"],
  });

  return data.products.nodes.map(normalizeProductCard);
}

export async function getProductByHandle(handle: string): Promise<Product | null> {  if (!shopifyConfig.enabled) {
    return mockDb.products.find((p) => p.handle === handle) ?? null;
  }

  const data = await shopifyFetch<{ product: Record<string, unknown> | null }>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    tags: [`product:${handle}`],
  });

  const raw = data.product;
  if (!raw) return null;

  const priceRange = raw.priceRange as { minVariantPrice: { amount: string; currencyCode: string }; maxVariantPrice: { amount: string; currencyCode: string } };
  const compareAtPriceRange = raw.compareAtPriceRange as typeof priceRange | null;
  const variants = (raw.variants as { nodes: Product["variants"] }).nodes;
  const images = (raw.images as { nodes: ProductImage[] }).nodes;

  return {
    id: raw.id as string,
    handle: raw.handle as string,
    title: raw.title as string,
    description: raw.description as string,
    descriptionHtml: raw.descriptionHtml as string,
    availableForSale: raw.availableForSale as boolean,
    tags: raw.tags as string[],
    vendor: raw.vendor as string,
    productType: raw.productType as string,
    featuredImage: normalizeImage(raw.featuredImage as ProductImage | null),
    images: images.map((i) => normalizeImage(i)!).filter(Boolean),
    priceRange: { min: priceRange.minVariantPrice, max: priceRange.maxVariantPrice },
    compareAtPriceRange: compareAtPriceRange
      ? { min: compareAtPriceRange.minVariantPrice, max: compareAtPriceRange.maxVariantPrice }
      : null,
    options: raw.options as Product["options"],
    variants,
    specs: normalizeSpecs(
      raw as unknown as Record<string, { value: string } | null>
    ),
  };
}

const NODES_BY_ID_QUERY = /* GraphQL */ `
  query ProductsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        handle
        title
        availableForSale
        tags
        featuredImage {
          url
          altText
          width
          height
        }
        images(first: 2) {
          nodes {
            url
            altText
            width
            height
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

/** Looks up a set of products by their Shopify (or mock) product IDs — used by the wishlist. */
export async function getProductsByIds(ids: string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return [];

  if (!shopifyConfig.enabled) {
    return mockDb.products.filter((p) => ids.includes(p.id)).map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      featuredImage: p.featuredImage,
      secondaryImage: p.images[1] ?? null,
      priceRange: p.priceRange,
      compareAtPriceRange: p.compareAtPriceRange,
      availableForSale: p.availableForSale,
      tags: p.tags,
    }));
  }

  const data = await shopifyFetch<{ nodes: (Parameters<typeof normalizeProductCard>[0] | null)[] }>({
    query: NODES_BY_ID_QUERY,
    variables: { ids },
    tags: ["products"],
  });

  return data.nodes.filter((n): n is Parameters<typeof normalizeProductCard>[0] => n !== null).map(normalizeProductCard);
}
