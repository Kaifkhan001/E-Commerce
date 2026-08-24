"use client";

import { useState } from "react";

type CheckState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "error"; message: string }
  | { status: "result"; serviceable: boolean; estimatedDays: number | null; codAvailable: boolean };

export function PincodeChecker({ weightKg = 0.5 }: { weightKg?: number }) {
  const [pincode, setPincode] = useState("");
  const [state, setState] = useState<CheckState>({ status: "idle" });

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setState({ status: "error", message: "Enter a valid 6-digit pincode" });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/shipping/check-pincode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, weightKg }),
      });
      const data = await res.json();

      if (!data.configured) {
        setState({ status: "unconfigured" });
        return;
      }
      setState({
        status: "result",
        serviceable: data.serviceable,
        estimatedDays: data.estimatedDays,
        codAvailable: data.codAvailable,
      });
    } catch {
      setState({ status: "error", message: "Could not check serviceability right now." });
    }
  }

  return (
    <div className="border-t border-border pt-6">
      <p className="mb-2 text-sm font-medium">Check delivery to your pincode</p>
      <form onSubmit={handleCheck} className="flex gap-2">
        <label htmlFor="pincode" className="sr-only">
          Pincode
        </label>
        <input
          id="pincode"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter 6-digit pincode"
          className="w-40 border border-border bg-ivory px-3 py-2 text-sm focus:border-charcoal"
        />
        <button type="submit" className="border border-charcoal px-4 py-2 text-sm hover:bg-charcoal hover:text-ivory">
          Check
        </button>
      </form>

      {state.status === "loading" ? <p className="mt-2 text-sm text-charcoal-soft">Checking…</p> : null}
      {state.status === "error" ? <p className="mt-2 text-sm text-sale">{state.message}</p> : null}
      {state.status === "unconfigured" ? (
        <p className="mt-2 text-sm text-charcoal-soft">Delivery availability checking isn&apos;t set up yet.</p>
      ) : null}
      {state.status === "result" ? (
        state.serviceable ? (
          <p className="mt-2 text-sm text-success">
            Deliverable{state.estimatedDays ? ` in ~${state.estimatedDays} day${state.estimatedDays === 1 ? "" : "s"}` : ""}
            {state.codAvailable ? " · Cash on delivery available" : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-sale">Not currently deliverable to this pincode.</p>
        )
      ) : null}
    </div>
  );
}
