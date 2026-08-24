"use server";

import { revalidatePath } from "next/cache";
import type { Cart } from "@/types/shopify";
import { addToCart, getCart, removeCartLine, updateCartLine } from "./cart";

export type CartActionResult = { ok: true; cart: Cart } | { ok: false; error: string };

export async function fetchCartAction(): Promise<Cart | null> {
  return getCart();
}

export async function addToCartAction(variantId: string, quantity: number): Promise<CartActionResult> {
  try {
    const cart = await addToCart(variantId, quantity);
    revalidatePath("/cart");
    return { ok: true, cart };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not add item to cart." };
  }
}

export async function updateCartLineAction(lineId: string, quantity: number): Promise<CartActionResult> {
  try {
    const cart = await updateCartLine(lineId, quantity);
    revalidatePath("/cart");
    return { ok: true, cart };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update cart." };
  }
}

export async function removeCartLineAction(lineId: string): Promise<CartActionResult> {
  try {
    const cart = await removeCartLine(lineId);
    revalidatePath("/cart");
    return { ok: true, cart };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not remove item." };
  }
}
