import Link from "next/link";
import { shopByCapacity, shopByPurpose } from "@/config/site";

export function ShopByPurpose() {
  return (
    <section className="container-brand py-16 md:py-24">
      <h2 className="font-display mb-8 text-2xl md:text-3xl">Shop by Purpose</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {shopByPurpose.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-center border border-border bg-ivory-deep px-4 py-6 text-center text-sm transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ShopByCapacity() {
  return (
    <section className="bg-ivory-deep py-16 md:py-24">
      <div className="container-brand">
        <h2 className="font-display mb-2 text-2xl md:text-3xl">Shop by Capacity</h2>
        <p className="mb-8 max-w-md text-sm text-charcoal-soft">
          Not sure how much space you need? Filter by liters, from a slim everyday sling to a full travel pack.
        </p>
        <div className="flex flex-wrap gap-3">
          {shopByCapacity.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border border-charcoal px-5 py-2.5 text-sm transition-colors hover:bg-charcoal hover:text-ivory"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
