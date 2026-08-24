import { LinkButton } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="bg-charcoal py-20 text-center text-ivory">
      <div className="container-brand">
        <h2 className="font-display mb-4 text-2xl md:text-4xl">Find your bag.</h2>
        <p className="mx-auto mb-8 max-w-md text-ivory/75">
          Browse the full collection, or tell us how you carry your day and we&apos;ll point you to a few that fit.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <LinkButton href="/shop" size="lg">
            Shop All Bags
          </LinkButton>
          <LinkButton href="/bag-finder" variant="secondary" size="lg" className="border-ivory text-ivory hover:bg-ivory hover:text-charcoal">
            Find My Bag
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
