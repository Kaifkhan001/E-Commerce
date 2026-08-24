import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, authProvidersConfigured } from "@/lib/auth/auth";
import { LoginButtons } from "@/components/auth/login-buttons";

export const metadata: Metadata = { title: "Log In" };

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/account");

  const anyConfigured = authProvidersConfigured.google || authProvidersConfigured.facebook || authProvidersConfigured.email;

  return (
    <div className="container-brand flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display mb-2 text-2xl">Log In</h1>
        <p className="mb-8 text-sm text-charcoal-soft">Access your orders, wishlist, and saved details.</p>

        {anyConfigured ? (
          <LoginButtons providers={authProvidersConfigured} />
        ) : (
          <div className="border border-border bg-ivory-deep p-5 text-left text-sm text-charcoal-soft">
            No sign-in providers are configured yet. Add Google, Facebook, or Email credentials to your
            environment (see <code className="text-charcoal">.env.example</code>) to enable login — see the README
            &ldquo;Auth provider setup&rdquo; section for step-by-step instructions.
          </div>
        )}
      </div>
    </div>
  );
}
