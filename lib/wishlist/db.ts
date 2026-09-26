import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { wishlistItems } from "@/lib/db/schema";

// Every function here takes a userId sourced from the SERVER session
// (auth()) — every caller (API routes, app/layout.tsx) must never accept a
// client-supplied id in its place. This is what guarantees a user can only
// ever see/modify their own wishlist.

const MAX_PRODUCT_ID_LENGTH = 200;

function isValidProductId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_PRODUCT_ID_LENGTH;
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ shopifyProductId: wishlistItems.shopifyProductId })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));
  return rows.map((r) => r.shopifyProductId);
}

/** Idempotent — adding a product already saved is a no-op, not an error, enforced by the unique index (not just this check). */
export async function addWishlistItem(userId: string, shopifyProductId: string): Promise<void> {
  if (!isValidProductId(shopifyProductId)) return;
  await db
    .insert(wishlistItems)
    .values({ userId, shopifyProductId })
    .onConflictDoNothing({ target: [wishlistItems.userId, wishlistItems.shopifyProductId] });
}

/** Idempotent — removing a product that isn't saved is a no-op, not an error. */
export async function removeWishlistItem(userId: string, shopifyProductId: string): Promise<void> {
  if (!isValidProductId(shopifyProductId)) return;
  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.shopifyProductId, shopifyProductId)));
}

const MAX_MERGE_ITEMS = 500;

/**
 * Merges an anonymous (localStorage) wishlist into the account's own on
 * login — see features/wishlist/wishlist-context.tsx for where this is
 * called from and why it can only happen client-side. Deduplication is
 * enforced by the SAME unique index addWishlistItem relies on
 * (onConflictDoNothing), not by checking existence first — a product
 * already in the account is silently skipped rather than duplicated,
 * even under concurrent calls.
 */
export async function mergeWishlistItems(userId: string, shopifyProductIds: string[]): Promise<string[]> {
  const clean = [...new Set(shopifyProductIds.filter(isValidProductId))].slice(0, MAX_MERGE_ITEMS);

  if (clean.length > 0) {
    await db
      .insert(wishlistItems)
      .values(clean.map((shopifyProductId) => ({ userId, shopifyProductId })))
      .onConflictDoNothing({ target: [wishlistItems.userId, wishlistItems.shopifyProductId] });
  }

  return getWishlistProductIds(userId);
}
