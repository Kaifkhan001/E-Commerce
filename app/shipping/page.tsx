import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "Shipping" };

export default function ShippingPage() {
  return (
    <ContentPage title="Shipping">
      <p>
        <strong className="text-charcoal">Placeholder content.</strong> Replace the details below with your
        actual shipping partners, timelines, and rates before launch.
      </p>
      <h2>Processing time</h2>
      <p>Orders are typically processed within 1–2 business days before dispatch.</p>
      <h2>Delivery timelines</h2>
      <p>Domestic orders: 3–7 business days. International orders: timelines vary by destination.</p>
      <h2>Shipping costs</h2>
      <p>Free shipping is offered on prepaid orders over ₹2,999. Costs below that threshold and for cash-on-delivery orders are calculated at checkout.</p>
    </ContentPage>
  );
}
