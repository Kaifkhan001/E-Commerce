"use client";

import { signIn } from "next-auth/react";
import { trackEvent } from "@/lib/analytics/track";

export function LoginButtons({ providers }: { providers: { google: boolean; facebook: boolean; email: boolean } }) {
  return (
    <div className="flex flex-col gap-3">
      {providers.google ? (
        <button
          onClick={() => {
            trackEvent("login", { method: "google" });
            signIn("google", { callbackUrl: "/account" });
          }}
          className="border border-border py-3 text-sm hover:border-charcoal"
        >
          Continue with Google
        </button>
      ) : null}
      {providers.facebook ? (
        <button
          onClick={() => {
            trackEvent("login", { method: "facebook" });
            signIn("facebook", { callbackUrl: "/account" });
          }}
          className="border border-border py-3 text-sm hover:border-charcoal"
        >
          Continue with Facebook
        </button>
      ) : null}
      {providers.email ? <EmailSignInForm /> : null}
    </div>
  );
}

function EmailSignInForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
        trackEvent("login", { method: "email" });
        signIn("nodemailer", { email, callbackUrl: "/account" });
      }}
      className="flex flex-col gap-2 border-t border-border pt-3"
    >
      <label htmlFor="email" className="text-left text-xs text-charcoal-soft">
        Or continue with email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="border border-border bg-ivory px-4 py-2.5 text-sm focus:border-charcoal"
      />
      <button type="submit" className="bg-charcoal py-2.5 text-sm text-ivory hover:bg-charcoal-soft">
        Send Magic Link
      </button>
    </form>
  );
}
