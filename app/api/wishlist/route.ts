import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { addWishlistItem, removeWishlistItem } from "@/lib/wishlist/db";

async function readProductId(request: Request): Promise<string | null> {
  try {
    const body = await request.json();
    return typeof body?.shopifyProductId === "string" ? body.shopifyProductId : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const shopifyProductId = await readProductId(request);
  if (!shopifyProductId) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  await addWishlistItem(userId, shopifyProductId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const shopifyProductId = await readProductId(request);
  if (!shopifyProductId) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  await removeWishlistItem(userId, shopifyProductId);
  return NextResponse.json({ ok: true });
}
