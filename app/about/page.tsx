import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="container-brand py-14 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl md:text-4xl">Our Story</h1>
        <p className="mt-5 text-charcoal-soft">
          {siteConfig.name} designs and manufactures bags for people who move through their day carrying real
          things — laptops, gym kits, camera gear, a week of clothes. We started because we couldn&apos;t find bags
          that were built as carefully as the things we were putting inside them.
        </p>
      </div>

      <div className="relative mx-auto mt-12 aspect-[16/9] max-w-4xl overflow-hidden bg-ivory-deep">
        <Image
          src="/images/Product-Image-05.jpeg"
          alt="A rust-colored canvas backpack being carried by its top handle"
          fill
          sizes="(min-width: 1024px) 900px, 100vw"
          className="object-cover"
        />
      </div>

      <div id="craftsmanship" className="mx-auto mt-16 grid max-w-4xl gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display mb-3 text-xl">What we manufacture ourselves</h2>
          <p className="text-charcoal-soft">
            Every bag we sell is made in our own production process — we choose the fabric, test the hardware,
            and inspect the stitching before it ships. That&apos;s what &ldquo;manufacturer&rdquo; means to us, not a marketing
            line.
          </p>
        </div>
        <div>
          <h2 className="font-display mb-3 text-xl">Why bags, specifically</h2>
          <p className="text-charcoal-soft">
            A bag is one of the few things you touch every single day. We think that deserves more attention to
            detail than it usually gets.
          </p>
        </div>
      </div>

      <p className="mx-auto mt-16 max-w-2xl text-center text-xs text-charcoal-soft">
        This page uses placeholder brand copy. Replace it with your actual company story before launch.
      </p>
    </div>
  );
}
