"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type TrackingStage = "placed" | "shipped" | "out_for_delivery" | "delivered";

type TrackingResult = {
  found: true;
  order: {
    name: string;
    items: { title: string; quantity: number }[];
    total: { amount: string; currencyCode: string };
  };
  tracking: {
    stage: TrackingStage;
    isConfirmed: boolean;
    estimatedDeliveryByDate: string;
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
        <div className="mt-8">
          <p className="mb-6 text-sm text-charcoal-soft">
            Order <span className="font-medium text-charcoal">{state.data.order.name}</span>
          </p>

          <ol className="flex items-start justify-between gap-2">
            {STEPS.map((step, index) => {
              const isComplete = index <= activeIndex;
              const isEstimated = index < 3 && index <= activeIndex;
              const isConfirmedDelivered = step.key === "delivered" && index === activeIndex && state.data.tracking.isConfirmed;

              return (
                <li key={step.key} className="flex flex-1 flex-col items-center text-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-xs",
                      isComplete ? "border-charcoal bg-charcoal text-ivory" : "border-border bg-ivory text-charcoal-soft"
                    )}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <p className="mt-2 text-xs font-medium text-charcoal">{step.label}</p>
                  {isEstimated ? <p className="mt-0.5 text-[11px] text-charcoal-soft">Estimated</p> : null}
                  {isConfirmedDelivered ? (
                    <p className="mt-0.5 text-[11px] text-success">Confirmed by our team</p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-charcoal-soft">
        Placed, Shipped, and Out for Delivery are estimated based on typical delivery timelines for your area —
        not live courier tracking. Delivered is confirmed manually by our team once your order actually arrives.
      </p>
    </div>
  );
}
