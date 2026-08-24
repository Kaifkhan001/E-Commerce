import type { Product, ProductCardData } from "@/types/shopify";
import { mockDb } from "@/lib/shopify/mock-data";
import { shopifyConfig } from "@/lib/shopify/config";
import { getProducts } from "@/lib/shopify/products";

export type BagFinderAnswers = {
  purpose: string; // "Work" | "Travel" | "College" | "Everyday" | "Gym" | "Weekend" | "Camera"
  carriesLaptop: boolean;
  capacity: "small" | "medium" | "large" | "xlarge"; // <10L, 10-25L, 25-35L, 35L+
};

function capacityMatchesBand(liters: number | undefined, band: BagFinderAnswers["capacity"]): boolean {
  if (liters == null) return false;
  switch (band) {
    case "small":
      return liters < 10;
    case "medium":
      return liters >= 10 && liters <= 25;
    case "large":
      return liters > 25 && liters <= 35;
    case "xlarge":
      return liters > 35;
  }
}

/**
 * Deterministic (non-AI) scoring: purpose match is weighted highest since
 * it's the most direct signal of fit, followed by capacity band, then
 * laptop compatibility as a hard-ish preference. Ties broken by original
 * catalog order. This is intentionally simple and auditable — swap in a
 * smarter model later only if it demonstrably improves match quality, not
 * for its own sake.
 */
function scoreProduct(product: Product, answers: BagFinderAnswers): number {
  let score = 0;
  if (product.specs.useCases?.includes(answers.purpose)) score += 5;
  if (capacityMatchesBand(product.specs.capacityLiters, answers.capacity)) score += 3;
  if (answers.carriesLaptop && product.specs.laptopCompatibility) score += 2;
  if (!answers.carriesLaptop) score += 0.5; // slight nudge toward not over-recommending laptop bags when unnecessary
  return score;
}

export async function recommendBags(answers: BagFinderAnswers, limit = 4): Promise<ProductCardData[]> {
  // Mock mode has full Product objects (with specs) locally; live mode needs
  // per-product detail fetches since list queries don't include metafields.
  if (!shopifyConfig.enabled) {
    return mockDb.products
      .map((p) => ({ product: p, score: scoreProduct(p, answers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ product }) => ({
        id: product.id,
        handle: product.handle,
        title: product.title,
        featuredImage: product.featuredImage,
        secondaryImage: product.images[1] ?? null,
        priceRange: product.priceRange,
        compareAtPriceRange: product.compareAtPriceRange,
        availableForSale: product.availableForSale,
        tags: product.tags,
      }));
  }

  // Live mode: fall back to a lighter heuristic using tags only (no
  // per-product metafield fetch here, to avoid N+1 API calls on every quiz
  // submission). Once metafields are populated, consider adding a dedicated
  // Storefront `search` query filtered by metafield value for full accuracy.
  const products = await getProducts({ first: 48 });
  return products
    .filter((p) => p.tags.some((t) => t.toLowerCase() === answers.purpose.toLowerCase()))
    .slice(0, limit);
}
