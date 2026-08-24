import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  { q: "What materials do you use?", a: "Materials vary by product — check the Specifications section on each product page for the exact material used in that bag." },
  { q: "How do I know what size bag I need?", a: "Each product page lists capacity in liters and dimensions. Use the Shop by Capacity page to filter by size." },
  { q: "Do your bags come with a warranty?", a: "Warranty coverage, where offered, is listed in the Specifications section of the relevant product page." },
  { q: "Can I track my order?", a: "Yes — once your order ships, you'll receive a tracking link by email. You can also check order status from your account page." },
  { q: "Do you ship internationally?", a: "See our Shipping page for current destinations and delivery timelines." },
  { q: "What's your return window?", a: "See our Returns page for the current policy and how to start a return." },
];

export default function FaqPage() {
  return (
    <ContentPage title="Frequently Asked Questions">
      <div className="divide-y divide-border">
        {faqs.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-charcoal">
              {f.q}
              <span className="ml-4 shrink-0 text-charcoal-soft transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm">{f.a}</p>
          </details>
        ))}
      </div>
    </ContentPage>
  );
}
