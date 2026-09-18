"use client";

import { useState } from "react";
import { OrderTrackingResult, type OrderTrackingResultData } from "./order-tracking-result";

type ViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "unconfigured" }
  | { status: "result"; data: OrderTrackingResultData };

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
          <OrderTrackingResult data={state.data} />
        </div>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-charcoal-soft">
        Placed, Shipped, and Out for Delivery are estimated based on typical delivery timelines for your area —
        not live courier tracking. Delivered is confirmed manually by our team once your order actually arrives.
      </p>
    </div>
  );
}
