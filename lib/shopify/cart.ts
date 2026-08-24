import "server-only";
import { cookies } from "next/headers";
import type { Cart } from "@/types/shopify";
import { shopifyConfig } from "./config";
import { shopifyFetch } from "./client";
import { CART_QUERY } from "./queries";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from "./mutations";
import { mockAddLine, mockCreateCart, mockGetCart, mockRemoveLine, mockUpdateLine } from "./mock-data";

const CART_COOKIE = "bag_store_cart_id";

async function readCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(id: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

type RawCartResponse = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: Cart["cost"];
  lines: { nodes: Cart["lines"] };
};

function normalizeCart(raw: RawCartResponse): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    cost: raw.cost,
    lines: raw.lines.nodes,
  };
}

/** Gets the current cart from the cookie, or null if none exists yet. */
export async function getCart(): Promise<Cart | null> {
  const cartId = await readCartId();
  if (!cartId) return null;

  if (!shopifyConfig.enabled) {
    return mockGetCart(cartId);
  }

  try {
    const data = await shopifyFetch<{ cart: RawCartResponse | null }>({
      query: CART_QUERY,
      variables: { id: cartId },
      cache: "no-store",
    });
    return data.cart ? normalizeCart(data.cart) : null;
  } catch {
    // Cart may have expired or been deleted server-side (Shopify carts expire
    // after ~10 days of inactivity by default). Treat as no cart.
    return null;
  }
}

async function ensureCart(): Promise<Cart> {
  const existing = await getCart();
  if (existing) return existing;

  if (!shopifyConfig.enabled) {
    const cart = mockCreateCart();
    await writeCartId(cart.id);
    return cart;
  }

  const data = await shopifyFetch<{ cartCreate: { cart: RawCartResponse; userErrors: { message: string }[] } }>({
    query: CART_CREATE_MUTATION,
    variables: { lines: [] },
    cache: "no-store",
  });
  if (data.cartCreate.userErrors.length) {
    throw new Error(`Failed to create cart: ${data.cartCreate.userErrors.map((e) => e.message).join(", ")}`);
  }
  const cart = normalizeCart(data.cartCreate.cart);
  await writeCartId(cart.id);
  return cart;
}

export async function addToCart(variantId: string, quantity: number): Promise<Cart> {
  const cart = await ensureCart();

  if (!shopifyConfig.enabled) {
    return mockAddLine(cart.id, variantId, quantity);
  }

  const data = await shopifyFetch<{ cartLinesAdd: { cart: RawCartResponse; userErrors: { message: string }[] } }>({
    query: CART_LINES_ADD_MUTATION,
    variables: { cartId: cart.id, lines: [{ merchandiseId: variantId, quantity }] },
    cache: "no-store",
  });
  if (data.cartLinesAdd.userErrors.length) {
    throw new Error(`Failed to add to cart: ${data.cartLinesAdd.userErrors.map((e) => e.message).join(", ")}`);
  }
  return normalizeCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(lineId: string, quantity: number): Promise<Cart> {
  const cart = await ensureCart();

  if (!shopifyConfig.enabled) {
    return mockUpdateLine(cart.id, lineId, quantity);
  }

  if (quantity <= 0) {
    const data = await shopifyFetch<{ cartLinesRemove: { cart: RawCartResponse; userErrors: { message: string }[] } }>({
      query: CART_LINES_REMOVE_MUTATION,
      variables: { cartId: cart.id, lineIds: [lineId] },
      cache: "no-store",
    });
    if (data.cartLinesRemove.userErrors.length) {
      throw new Error(`Failed to remove line: ${data.cartLinesRemove.userErrors.map((e) => e.message).join(", ")}`);
    }
    return normalizeCart(data.cartLinesRemove.cart);
  }

  const data = await shopifyFetch<{ cartLinesUpdate: { cart: RawCartResponse; userErrors: { message: string }[] } }>({
    query: CART_LINES_UPDATE_MUTATION,
    variables: { cartId: cart.id, lines: [{ id: lineId, quantity }] },
    cache: "no-store",
  });
  if (data.cartLinesUpdate.userErrors.length) {
    throw new Error(`Failed to update line: ${data.cartLinesUpdate.userErrors.map((e) => e.message).join(", ")}`);
  }
  return normalizeCart(data.cartLinesUpdate.cart);
}

export async function removeCartLine(lineId: string): Promise<Cart> {
  const cart = await ensureCart();
  if (!shopifyConfig.enabled) {
    return mockRemoveLine(cart.id, lineId);
  }
  return updateCartLine(lineId, 0);
}
