import type { Metadata } from "next";
import { WishlistView } from "@/components/product/wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

// Deliberately public — anonymous visitors have a real (localStorage)
// wishlist and must be able to view it without signing in. WishlistView
// itself is auth-agnostic (it just renders whatever useWishlist() returns),
// so this same page works correctly whether the visitor is anonymous or
// signed in. /account/wishlist is the signed-in-only equivalent reachable
// from the account hub's nav — see its own auth gate for why it's separate.
export default function WishlistPage() {
  return (
    <div className="container-brand py-10 md:py-14">
      <h1 className="font-display mb-6 text-2xl md:text-3xl">Wishlist</h1>
      <WishlistView />
    </div>
  );
}
