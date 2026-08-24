import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/shopify/products";

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "`ids` must be an array" }, { status: 400 });
    }
    const products = await getProductsByIds(ids.slice(0, 100));
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load products" },
      { status: 500 }
    );
  }
}
