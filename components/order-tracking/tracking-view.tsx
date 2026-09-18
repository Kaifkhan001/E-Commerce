"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import type { Money } from "@/types/shopify";

type TrackingStage = "placed" | "shipped" | "out_for_delivery" | "delivered";

type TrackingResult = {
  found: true;
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

type ViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "unconfigured" }
  | { status: "result"; data: TrackingResult };

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

function stageDateFor(key: TrackingStage, data: TrackingResult): string {
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

function StepDate({ step, index, activeIndex, data }: { step: (typeof STEPS)[number]; index: number; activeIndex: number; data: TrackingResult }) {
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

export function TrackingView() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<ViewState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const data = await res.json();

      if (data.found) {
        setState({ status: "result", data });
      } else if (data.reason === "not_configured") {
        setState({ status: "unconfigured" });
      } else {
        // "not_found" and "email_mismatch" are shown identically to the
        // user — that distinction is only useful for our own debugging.
        setState({ status: "not_found" });
      }
    } catch {
      setState({ status: "not_found" });
    }
  }

  const activeIndex = state.status === "result" ? stageIndex(state.data.tracking.stage) : -1;

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="orderNumber" className="mb-1 block text-sm font-medium text-charcoal">
            Order number
          </label>
          <input
            id="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="#1001"
            className="w-full border border-border bg-ivory px-3 py-2 text-sm focus:border-charcoal"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-charcoal">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-border bg-ivory px-3 py-2 text-sm focus:border-charcoal"
          />
        </div>
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="border border-charcoal px-6 py-2 text-sm hover:bg-charcoal hover:text-ivory disabled:opacity-50"
        >
          {state.status === "loading" ? "Checking…" : "Track Order"}
        </button>
      </form>

      {state.status === "not_found" ? (
        <p className="mt-4 text-sm text-sale">
          We couldn&apos;t find a matching order. Check your order number and email and try again.
        </p>
      ) : null}

      {state.status === "unconfigured" ? (
        <p className="mt-4 text-sm text-charcoal-soft">Order tracking isn&apos;t available right now.</p>
      ) : null}

      {state.status === "result" ? (
        <div className="mt-8 space-y-8">
          <div>
            <p className="mb-1 text-sm text-charcoal-soft">
              Order <span className="font-medium text-charcoal">{state.data.order.name}</span>
              <span className="text-charcoal-soft"> · {formatShortDate(state.data.order.date)}</span>
            </p>
            <p className="font-display text-xl text-charcoal">
              {state.data.tracking.isConfirmed
                ? "Delivered"
                : `Arriving by ${formatShortDate(state.data.tracking.estimatedDeliveryByDate)}`}
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
                    <StepDate step={step} index={index} activeIndex={activeIndex} data={state.data} />
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
                    <StepDate step={step} index={index} activeIndex={activeIndex} data={state.data} />
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
              {state.data.order.items.map((item, i) => (
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
              <span className="font-medium text-charcoal">{formatMoney(state.data.order.total)}</span>
            </div>

            {state.data.order.shippingAddress ? (
              <div className="mt-4 border-t border-border pt-4 text-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-charcoal-soft">Delivering to</p>
                <p className="text-charcoal">
                  {state.data.order.shippingAddress.city}, {state.data.order.shippingAddress.province}{" "}
                  {state.data.order.shippingAddress.zip}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-charcoal-soft">
        Placed, Shipped, and Out for Delivery are estimated based on typical delivery timelines for your area —
        not live courier tracking. Delivered is confirmed manually by our team once your order actually arrives.
      </p>
    </div>
  );
}
