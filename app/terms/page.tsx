import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <ContentPage title="Terms of Service">
      <p>
        <strong className="text-charcoal">Placeholder content — not legal advice.</strong> Replace with real
        terms reviewed by a qualified professional before launch.
      </p>
      <h2>Orders and payment</h2>
      <p>Describe accepted payment methods, pricing, and order confirmation process.</p>
      <h2>Use of site</h2>
      <p>Standard acceptable-use terms for the storefront.</p>
      <h2>Limitation of liability</h2>
      <p>Standard liability limitation language, reviewed by counsel.</p>
    </ContentPage>
  );
}
