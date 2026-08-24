import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "Returns & Exchanges" };

export default function ReturnsPage() {
  return (
    <ContentPage title="Returns & Exchanges">
      <p>
        <strong className="text-charcoal">Placeholder content.</strong> Replace the details below with your
        actual return window, conditions, and process before launch.
      </p>
      <h2>Return window</h2>
      <p>Items may be returned within a set number of days of delivery, provided they are unused and in original packaging.</p>
      <h2>How to start a return</h2>
      <p>Contact us via the Contact page with your order number to begin a return or exchange.</p>
      <h2>Refunds</h2>
      <p>Approved refunds are issued to the original payment method after the returned item is inspected.</p>
    </ContentPage>
  );
}
