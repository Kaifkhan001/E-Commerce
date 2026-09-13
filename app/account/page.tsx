import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { WalletSection } from "@/components/account/wallet-section";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="container-brand py-14">
      <h1 className="font-display mb-6 text-2xl">Account</h1>
      <p className="mb-1 text-sm text-charcoal-soft">Signed in as</p>
      <p className="mb-8">{session.user?.email ?? session.user?.name}</p>

      {session.user?.email ? (
        <WalletSection email={session.user.email} />
      ) : (
        <div className="mb-8 border border-border p-5">
          <h2 className="mb-2 font-medium">Wallet</h2>
          <p className="text-sm text-charcoal-soft">
            We don&rsquo;t have an email on file for this account, so we can&rsquo;t look up a wallet balance.
          </p>
        </div>
      )}

      <div className="mb-8 border border-border p-5">
        <h2 className="mb-2 font-medium">Orders</h2>
        <p className="text-sm text-charcoal-soft">
          Order history requires connecting Shopify Customer Accounts — this section is a placeholder until that
          integration is wired up (see README &ldquo;Shopify Customer Data&rdquo;).
        </p>
      </div>

      <SignOutButton />
    </div>
  );
}
