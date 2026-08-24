import type { Metadata } from "next";
import { BagFinder } from "@/features/bag-finder/bag-finder";

export const metadata: Metadata = {
  title: "Bag Finder",
  description: "Answer three questions and we'll point you to a few bags that fit.",
};

export default function BagFinderPage() {
  return (
    <div className="container-brand py-14 md:py-20">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl md:text-4xl">Find Your Bag</h1>
        <p className="mx-auto mt-3 max-w-md text-charcoal-soft">
          Three quick questions, then a short list of bags that actually fit how you carry your day.
        </p>
      </div>
      <BagFinder />
    </div>
  );
}
