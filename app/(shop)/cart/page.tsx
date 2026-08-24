import type { Metadata } from "next";
import { getCart } from "@/lib/shopify/cart";
import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata: Metadata = { title: "Your Bag" };

export default async function CartPage() {
  const cart = await getCart();
  return (
    <div className="container-brand py-10 md:py-14">
      <h1 className="font-display mb-8 text-2xl md:text-3xl">Your Bag</h1>
      <CartPageView initialCart={cart} />
    </div>
  );
}
