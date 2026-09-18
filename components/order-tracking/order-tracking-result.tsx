import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import type { Money } from "@/types/shopify";

// Shared, presentation-only rendering of a found order lookup — used by both
// the standalone /track-order form flow (components/order-tracking/tracking-view.tsx)
// and the authenticated per-order page (app/account/orders/[orderNumber]),
// so both surfaces stay visually identical. Every date here is a string
// (ISO or otherwise Date-parseable) — callers normalize before passing in,
// so this component never has to care whether the value crossed a JSON
// boundary or came straight from a Server Component.

export type TrackingStage = "placed" | "shipped" | "out_for_delivery" | "delivered";

export type OrderTrackingResultData = {
  order: {
    name: string;
    date: string;
    items: { title: string; quantity: number; imageUrl: string | null; imageAlt: string | null }[];
    total: Money;
    shippingAddress: { city: string; province: string; zip: string } | null;
  };
  tracking: {
    stage: TrackingStage;
    isConfirmed: boolean;
    estimatedDeliveryByDate: string;
  };
  stageDates: {
    placed: string;
    shipped: string;
    outForDelivery: string;
  };
};

const STEPS: { key: TrackingStage; label: string }[] = [
  { key: "placed", label: "Order Placed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

function stageIndex(stage: TrackingStage): number {
  return STEPS.findIndex((step) => step.key === stage);
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));
}

function stageDateFor(key: TrackingStage, data: OrderTrackingResultData): string {
  switch (key) {
    case "placed":
      return data.stageDates.placed;
    case "shipped":
      return data.stageDates.shipped;
    case "out_for_delivery":
      return data.stageDates.outForDelivery;
    case "delivered":
      return data.tracking.estimatedDeliveryByDate;
  }
}

function StepCircle({ isComplete }: { isComplete: boolean }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
        isComplete ? "border-charcoal bg-charcoal text-ivory" : "border-border bg-ivory"
      )}
    >
      {isComplete ? <Check className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-border" />}
    </div>
  );
}

function StepDate({
  step,
  index,
  activeIndex,
  data,
}: {
  step: (typeof STEPS)[number];
  index: number;
  activeIndex: number;
  data: OrderTrackingResultData;
}) {
  const isConfirmedDelivered = step.key === "delivered" && index <= activeIndex && data.tracking.isConfirmed;
  const isEstimate = step.key !== "placed" && !isConfirmedDelivered;

  return (
    <>
      <p className="mt-0.5 text-[11px] text-charcoal-soft">
        {formatShortDate(stageDateFor(step.key, data))}
        {isEstimate ? " (Est.)" : ""}
      </p>
      {isConfirmedDelivered ? <p className="mt-0.5 text-[11px] text-success">Confirmed by our team</p> : null}
    </>
  );
}

export function OrderTrackingResult({ data }: { data: OrderTrackingResultData }) {
  const activeIndex = stageIndex(data.tracking.stage);

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-sm text-charcoal-soft">
          Order <span className="font-medium text-charcoal">{data.order.name}</span>
          <span className="text-charcoal-soft"> · {formatShortDate(data.order.date)}</span>
        </p>
        <p className="font-display text-xl text-charcoal">
          {data.tracking.isConfirmed ? "Delivered" : `Arriving by ${formatShortDate(data.tracking.estimatedDeliveryByDate)}`}
        </p>
      </div>

      {/* Stepper — vertical on narrow screens, horizontal from sm: up */}
      <ol className="flex flex-col sm:hidden">
        {STEPS.map((step, index) => {
          const isComplete = index <= activeIndex;
          const isLast = index === STEPS.length - 1;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepCircle isComplete={isComplete} />
                {!isLast ? <div className={cn("w-px flex-1", index < activeIndex ? "bg-charcoal" : "bg-border")} /> : null}
              </div>
              <div className={cn("pb-6", isLast && "pb-0")}>
                <p className="text-xs font-medium text-charcoal">{step.label}</p>
                <StepDate step={step} index={index} activeIndex={activeIndex} data={data} />
              </div>
            </li>
          );
        })}
      </ol>

      <ol className="hidden sm:flex sm:items-start">
        {STEPS.map((step, index) => {
          const isComplete = index <= activeIndex;
          const isLast = index === STEPS.length - 1;
          return (
            <li key={step.key} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-1 flex-col items-center text-center last:flex-none">
                <StepCircle isComplete={isComplete} />
                <p className="mt-2 text-xs font-medium text-charcoal">{step.label}</p>
                <StepDate step={step} index={index} activeIndex={activeIndex} data={data} />
              </div>
              {!isLast ? <div className={cn("mt-4 h-px flex-1", index < activeIndex ? "bg-charcoal" : "bg-border")} /> : null}
            </li>
          );
        })}
      </ol>

      {/* Order summary */}
      <div className="border-t border-border pt-6">
        <h2 className="mb-4 text-sm font-medium text-charcoal">Order Summary</h2>
        <ul className="divide-y divide-border">
          {data.order.items.map((item, i) => (
            <li key={i} className="flex gap-4 py-3 first:pt-0">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-[15px] bg-ivory-deep">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.imageAlt || item.title} fill sizes="56px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 items-center justify-between gap-4">
                <p className="text-sm text-charcoal">{item.title}</p>
                <p className="shrink-0 text-sm text-charcoal-soft">Qty {item.quantity}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-charcoal-soft">Total</span>
          <span className="font-medium text-charcoal">{formatMoney(data.order.total)}</span>
        </div>

        {data.order.shippingAddress ? (
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-charcoal-soft">Delivering to</p>
            <p className="text-charcoal">
              {data.order.shippingAddress.city}, {data.order.shippingAddress.province} {data.order.shippingAddress.zip}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
