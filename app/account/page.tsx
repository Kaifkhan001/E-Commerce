import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AccountNav } from "@/components/account/account-nav";
import { AccountSummary } from "@/components/account/account-summary";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="container-brand py-10 md:py-14">
      <h1 className="font-display mb-2 text-2xl md:text-3xl">Account</h1>
      <p className="mb-6 text-sm text-charcoal-soft">
        Signed in as <span className="text-charcoal">{session.user?.email ?? session.user?.name}</span>
      </p>

      <AccountNav />

      {session.user?.email ? (
        <AccountSummary email={session.user.email} />
      ) : (
        <p className="mb-8 text-sm text-charcoal-soft">
          We don&rsquo;t have an email on file for this account, so we can&rsquo;t show your wallet or orders.
        </p>
      )}

      <SignOutButton />
    </div>
  );
}
