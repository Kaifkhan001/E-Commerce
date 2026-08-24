import type { Metadata } from "next";
import { TrackingView } from "@/components/order-tracking/tracking-view";

export const metadata: Metadata = { title: "Track Order" };

export default function TrackOrderPage() {
  return (
    <div className="container-brand py-14 md:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display mb-8 text-3xl">Track Order</h1>
        <TrackingView />
      </div>
    </div>
  );
}
