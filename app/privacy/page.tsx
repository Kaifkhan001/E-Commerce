import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy Policy">
      <p>
        <strong className="text-charcoal">Placeholder content — not legal advice.</strong> This page must be
        replaced with a real privacy policy reviewed against applicable law (e.g. India&apos;s DPDP Act, GDPR for
        EU customers) before launch. Do not publish this placeholder as your live policy.
      </p>
      <h2>What we collect</h2>
      <p>Describe here what customer, order, and browsing data is collected and why.</p>
      <h2>How we use it</h2>
      <p>Describe order fulfillment, marketing (with opt-in/opt-out), and analytics usage.</p>
      <h2>Third parties</h2>
      <p>List processors such as Shopify, payment gateways, analytics, and email providers.</p>
    </ContentPage>
  );
}
