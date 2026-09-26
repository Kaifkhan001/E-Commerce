import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { mergeWishlistItems } from "@/lib/wishlist/db";

// Called once, client-side, right after a fresh sign-in — see
// features/wishlist/wishlist-context.tsx for why this can only be
// triggered from the browser (it's the only place the anonymous
// localStorage wishlist exists) rather than from a NextAuth callback.
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  let shopifyProductIds: unknown;
  try {
    const body = await request.json();
    shopifyProductIds = body?.shopifyProductIds;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!Array.isArray(shopifyProductIds) || !shopifyProductIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const ids = await mergeWishlistItems(userId, shopifyProductIds);
  return NextResponse.json({ ok: true, ids });
}
