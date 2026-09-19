import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { AccountNav } from "@/components/account/account-nav";
import { WalletSection } from "@/components/account/wallet-section";

export const metadata: Metadata = { title: "Wallet" };

export default async function AccountWalletPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="container-brand py-10 md:py-14">
      <h1 className="font-display mb-6 text-2xl md:text-3xl">Wallet</h1>
      <AccountNav />
      {session.user?.email ? (
        <WalletSection email={session.user.email} />
      ) : (
        <p className="text-sm text-charcoal-soft">We don&rsquo;t have an email on file for this account.</p>
      )}
    </div>
  );
}
