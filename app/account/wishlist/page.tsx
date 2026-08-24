import type { Metadata } from "next";
import { WishlistView } from "@/components/product/wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="container-brand py-10 md:py-14">
      <h1 className="font-display mb-8 text-2xl md:text-3xl">Wishlist</h1>
      <WishlistView />
    </div>
  );
}
