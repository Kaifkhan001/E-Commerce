import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="container-brand py-14 md:py-20">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display mb-6 text-3xl">Contact Us</h1>
        <p className="mb-8 text-charcoal-soft">
          Have a question about an order, a product, or a bulk/corporate inquiry? Reach out below.
        </p>

        <div className="mb-10 space-y-2 text-sm">
          <p><span className="text-charcoal-soft">Email: </span>{siteConfig.contactEmail}</p>
          <p><span className="text-charcoal-soft">Phone: </span>{siteConfig.supportPhone}</p>
          <p><span className="text-charcoal-soft">Address: </span>{siteConfig.address}</p>
        </div>

        {/* NOTE: this form is UI-only and does not currently send anywhere.
            Wire it to an email service or form backend (e.g. Formspree,
            Resend, or a Shopify contact form) before launch. */}
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm">Name</label>
            <input id="name" name="name" required className="w-full border border-border bg-ivory px-4 py-2.5 text-sm focus:border-charcoal" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm">Email</label>
            <input id="email" name="email" type="email" required className="w-full border border-border bg-ivory px-4 py-2.5 text-sm focus:border-charcoal" />
          </div>
          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm">Message</label>
            <textarea id="message" name="message" rows={5} required className="w-full border border-border bg-ivory px-4 py-2.5 text-sm focus:border-charcoal" />
          </div>
          <button type="submit" className="bg-charcoal px-6 py-3 text-sm text-ivory hover:bg-charcoal-soft">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
