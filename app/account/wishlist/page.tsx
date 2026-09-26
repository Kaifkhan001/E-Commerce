import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { WishlistView } from "@/components/product/wishlist-view";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = { title: "Wishlist" };

// Now that this reads the account's own database-backed wishlist (not just
// localStorage), it needs the same auth gate as the other account pages.
// Anonymous visitors still have a real wishlist (localStorage) — they view
// it at the public /wishlist route instead, which renders the same
// WishlistView; see that page for why.
export default async function AccountWishlistPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="container-brand py-10 md:py-14">
      <h1 className="font-display mb-6 text-2xl md:text-3xl">Wishlist</h1>
      <AccountNav />
      <WishlistView />
    </div>
  );
}
