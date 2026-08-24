import Link from "next/link";

const faqs = [
  { q: "How long does shipping take?", a: "Most orders ship within 1–2 business days; see our shipping page for delivery timelines by region." },
  { q: "What's your return policy?", a: "We accept returns within a set window of delivery on unused items — see our returns page for the full policy." },
  { q: "Do you offer cash on delivery?", a: "Where available at checkout, yes — prepaid orders also unlock free shipping thresholds." },
];

export function FaqPreview() {
  return (
    <section className="container-brand py-16 md:py-24">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-display text-2xl md:text-3xl">Questions</h2>
        <Link href="/faq" className="text-sm underline underline-offset-4 hover:text-sand-dark">
          All FAQs
        </Link>
      </div>
      <div className="divide-y divide-border border-t border-border">
        {faqs.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
              {f.q}
              <span className="ml-4 shrink-0 text-charcoal-soft group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-sm text-charcoal-soft">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
