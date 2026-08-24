"use client";

import { useState } from "react";
import type { ProductCardData } from "@/types/shopify";
import { ProductCard } from "@/components/product/product-card";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const PURPOSES = ["Work", "Travel", "College", "Everyday", "Gym", "Weekend", "Camera"];
const CAPACITIES: { value: "small" | "medium" | "large" | "xlarge"; label: string }[] = [
  { value: "small", label: "Small — just the essentials" },
  { value: "medium", label: "Medium — a day's worth of gear (10–25L)" },
  { value: "large", label: "Large — a full day or short trip (25–35L)" },
  { value: "xlarge", label: "Extra large — multi-day travel (35L+)" },
];

type Step = 1 | 2 | 3 | "results";

export function BagFinder() {
  const [step, setStep] = useState<Step>(1);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [carriesLaptop, setCarriesLaptop] = useState<boolean | null>(null);
  const [results, setResults] = useState<ProductCardData[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCapacitySelect(value: (typeof CAPACITIES)[number]["value"]) {
    setLoading(true);
    setStep("results");
    try {
      const res = await fetch("/api/bag-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, carriesLaptop, capacity: value }),
      });
      const data = await res.json();
      setResults(data.products ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setPurpose(null);
    setCarriesLaptop(null);
    setResults(null);
  }

  return (
    <div className="mx-auto max-w-2xl">
      {step !== "results" ? (
        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("h-1 flex-1 bg-ivory-deep", step >= s && "bg-charcoal")} />
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <fieldset>
          <legend className="font-display mb-6 text-xl">What will you mainly use your bag for?</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PURPOSES.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPurpose(p);
                  setStep(2);
                }}
                className="border border-border px-4 py-4 text-sm hover:border-charcoal hover:bg-ivory-deep"
              >
                {p}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset>
          <legend className="font-display mb-6 text-xl">Do you usually carry a laptop?</legend>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCarriesLaptop(true);
                setStep(3);
              }}
              className="flex-1 border border-border px-4 py-4 text-sm hover:border-charcoal hover:bg-ivory-deep"
            >
              Yes
            </button>
            <button
              onClick={() => {
                setCarriesLaptop(false);
                setStep(3);
              }}
              className="flex-1 border border-border px-4 py-4 text-sm hover:border-charcoal hover:bg-ivory-deep"
            >
              No
            </button>
          </div>
        </fieldset>
      ) : null}

      {step === 3 ? (
        <fieldset>
          <legend className="font-display mb-6 text-xl">How much space do you need?</legend>
          <div className="flex flex-col gap-3">
            {CAPACITIES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCapacitySelect(c.value)}
                className="border border-border px-4 py-4 text-left text-sm hover:border-charcoal hover:bg-ivory-deep"
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {step === "results" ? (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl">
              {loading ? "Finding your bags…" : results && results.length > 0 ? "Recommended for you" : "No exact matches"}
            </h2>
            <button onClick={reset} className="text-sm underline underline-offset-4 hover:text-sand-dark">
              Start over
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse bg-ivory-deep" />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-charcoal-soft">We couldn&apos;t find an exact match — browse the full collection instead.</p>
              <LinkButton href="/shop">Shop All Bags</LinkButton>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
