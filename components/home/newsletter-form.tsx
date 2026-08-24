"use client";

import { useState } from "react";

// NOTE: This form does not currently send the email address anywhere — no
// email marketing service (Klaviyo, Mailchimp, Shopify Email, etc.) is
// connected yet. Wire the onSubmit handler up to your chosen provider's API
// before launch. Do not deploy this as-is and claim signups are captured.
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: connect to an email provider. Currently a no-op.
    setStatus("submitted");
  }

  if (status === "submitted") {
    return <p className="text-sm text-charcoal">Thanks — you&apos;re on the list.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="w-full border border-border bg-ivory px-4 py-2.5 text-sm placeholder:text-charcoal-soft/60 focus:border-charcoal"
      />
      <button type="submit" className="shrink-0 bg-charcoal px-5 py-2.5 text-sm text-ivory hover:bg-charcoal-soft">
        Join
      </button>
    </form>
  );
}
