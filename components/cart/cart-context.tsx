"use client";

import { createContext, useCallback, useContext, useState, useTransition } from "react";
import type { Cart } from "@/types/shopify";
import { addToCartAction, fetchCartAction, removeCartLineAction, updateCartLineAction } from "@/lib/shopify/cart-actions";
import { trackEvent } from "@/lib/analytics/track";

type CartContextValue = {
  cart: Cart | null;
  isPending: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  error: string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, initialCart }: { children: React.ReactNode; initialCart: Cart | null }) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addItem = useCallback(async (variantId: string, quantity = 1) => {
    setError(null);
    startTransition(async () => {
      const result = await addToCartAction(variantId, quantity);
      if (result.ok) {
        setCart(result.cart);
        setDrawerOpen(true);
        trackEvent("add_to_cart", { variant_id: variantId, quantity });
      } else {
        setError(result.error);
      }
    });
  }, []);

  const updateItem = useCallback(async (lineId: string, quantity: number) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCartLineAction(lineId, quantity);
      if (result.ok) setCart(result.cart);
      else setError(result.error);
    });
  }, []);

  const removeItem = useCallback(async (lineId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await removeCartLineAction(lineId);
      if (result.ok) {
        setCart(result.cart);
        trackEvent("remove_from_cart", { line_id: lineId });
      } else {
        setError(result.error);
      }
    });
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isPending,
        isDrawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        addItem,
        updateItem,
        removeItem,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

// Refetch helper for places that need a fresh cart without a mutation
// (e.g. after navigation). Exported separately to keep the context lean.
export { fetchCartAction };
