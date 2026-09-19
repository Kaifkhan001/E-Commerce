"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CANCELLATION_REASONS } from "@/lib/order-cancellation/reasons";

export type OrderCancellationState = {
  eligibility: "auto_cancel" | "request" | "already_cancelled";
  cancelledAt: string | null;
  existingRequestAt: string | null;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

type PanelStatus = "idle" | "open" | "submitting" | "error";

export function OrderCancellation({ orderNumber, state }: { orderNumber: string; state: OrderCancellationState }) {
  const router = useRouter();
  const [panel, setPanel] = useState<PanelStatus>("idle");
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (state.cancelledAt) {
    return (
      <div className="border-t border-border pt-6">
        <p className="text-sm text-charcoal-soft">This order was cancelled on {formatDate(state.cancelledAt)}.</p>
      </div>
    );
  }

  if (state.existingRequestAt) {
    return (
      <div className="border-t border-border pt-6">
        <p className="text-sm text-charcoal-soft">
          You requested cancellation on {formatDate(state.existingRequestAt)} — our team will follow up with you shortly.
        </p>
      </div>
    );
  }

  const isRequestOnly = state.eligibility === "request";
  const endpoint = isRequestOnly
    ? `/api/account/orders/${orderNumber}/request-cancellation`
    : `/api/account/orders/${orderNumber}/cancel`;

  async function handleConfirm() {
    if (!reason) return;
    setPanel("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMessage(errorMessageFor(data.error));
        setPanel("error");
        return;
      }

      // Server state changed (order cancelled, or a request is now on
      // file) — re-render from the server rather than guessing at the new
      // state on the client, so this stays in sync with whatever Shopify
      // and the database actually recorded.
      router.refresh();
    } catch {
      setErrorMessage(errorMessageFor(undefined));
      setPanel("error");
    }
  }

  if (panel === "idle") {
    return (
      <div className="border-t border-border pt-6">
        <button
          type="button"
          onClick={() => setPanel("open")}
          className="border border-charcoal px-5 py-2.5 text-sm hover:bg-charcoal hover:text-ivory"
        >
          {isRequestOnly ? "Request cancellation" : "Cancel this order"}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-6">
      <div className="max-w-sm border border-border p-5">
        <h3 className="mb-1 text-sm font-medium text-charcoal">
          {isRequestOnly ? "Request cancellation" : "Cancel this order"}
        </h3>
        <p className="mb-4 text-xs text-charcoal-soft">
          {isRequestOnly
            ? "This order has already been fulfilled or is being processed, so we can't cancel it automatically. Let us know why and our team will follow up."
            : "This can't be undone. Tell us why you're cancelling."}
        </p>

        <label htmlFor="cancel-reason" className="mb-1 block text-xs font-medium text-charcoal">
          Reason
        </label>
        <select
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={panel === "submitting"}
          className="mb-4 w-full border border-border bg-ivory px-3 py-2 text-sm focus:border-charcoal"
        >
          <option value="" disabled>
            Select a reason
          </option>
          {CANCELLATION_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {panel === "error" && errorMessage ? <p className="mb-4 text-xs text-sale">{errorMessage}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!reason || panel === "submitting"}
            className="border border-charcoal bg-charcoal px-5 py-2.5 text-sm text-ivory hover:bg-charcoal-soft disabled:opacity-50"
          >
            {panel === "submitting"
              ? "Please wait…"
              : isRequestOnly
                ? "Send cancellation request"
                : "Yes, cancel this order"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPanel("idle");
              setReason("");
              setErrorMessage(null);
            }}
            disabled={panel === "submitting"}
            className="px-5 py-2.5 text-sm text-charcoal-soft hover:text-charcoal disabled:opacity-50"
          >
            Never mind
          </button>
        </div>
      </div>
    </div>
  );
}

function errorMessageFor(code: string | undefined): string {
  switch (code) {
    case "already_cancelled":
      return "This order has already been cancelled.";
    case "no_longer_auto_cancellable":
      return "This order has started being fulfilled, so it can no longer be cancelled automatically. Refresh the page to request a cancellation instead.";
    case "order_not_found":
      return "We couldn't find this order on your account.";
    case "cancellation_failed":
      return "We couldn't cancel your order right now. Please try again in a moment, or contact us for help.";
    case "not_confirmed":
      return "Your cancellation is being processed — refresh the page in a moment to see the update.";
    default:
      return "Something went wrong. Please try again in a moment.";
  }
}
