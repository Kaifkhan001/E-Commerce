import { LinkButton } from "@/components/ui/button";
import { HeroCarousel } from "@/components/home/hero-carousel";

export function Hero() {
  return (
    <section className="relative flex min-h-[86vh] items-end overflow-hidden bg-charcoal text-ivory md:min-h-[92vh]">
      <HeroCarousel />
      <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />
      <div className="pointer-events-none relative z-10 container-brand pb-16 pt-32 md:pb-24">
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-sand">Designed in-house. Built to last.</p>
        <h1 className="font-display max-w-xl text-4xl leading-[1.05] md:text-6xl">
          Bags for the way you actually move.
        </h1>
        <p className="mt-5 max-w-md text-ivory/80">
          We manufacture our own backpacks, totes, and travel bags — built for the commute, the flight,
          and everything in between.
        </p>
        <div className="pointer-events-auto mt-8 flex flex-wrap gap-4">
          <LinkButton href="/shop" size="lg">
            Shop Bags
          </LinkButton>
          <LinkButton href="/collections" variant="secondary" size="lg" className="border-ivory text-ivory hover:bg-ivory hover:text-charcoal">
            Explore Collection
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
