import Image from "next/image";

export function Craftsmanship() {
  return (
    <section id="craftsmanship" className="container-brand grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
      <div className="relative aspect-[4/5] overflow-hidden bg-ivory-deep md:order-2">
        <Image
          src="/images/Product-Image-04.jpeg"
          alt="Burnt-orange canvas backpack showing its front zip pocket and buckle hardware"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="md:order-1">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-sand-dark">Craftsmanship</p>
        <h2 className="font-display mb-5 text-2xl md:text-3xl">Made by us, not licensed out.</h2>
        <p className="mb-4 text-charcoal-soft">
          Every bag is manufactured in our own facilities, so we control the materials, the stitching, and the
          hardware from the first sample to the final unit — not just the label.
        </p>
        <p className="text-charcoal-soft">
          We test zippers for thousands of cycles, reinforce stress points at the straps, and hand-inspect every
          bag before it ships.
        </p>
      </div>
    </section>
  );
}
