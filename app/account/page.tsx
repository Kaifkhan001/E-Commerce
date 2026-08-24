import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="container-brand py-14">
      <h1 className="font-display mb-6 text-2xl">Account</h1>
      <p className="mb-1 text-sm text-charcoal-soft">Signed in as</p>
      <p className="mb-8">{session.user?.email ?? session.user?.name}</p>

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
