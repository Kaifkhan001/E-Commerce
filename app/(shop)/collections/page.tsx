import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCollections } from "@/lib/shopify/collections";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="container-brand py-10 md:py-14">
      <h1 className="font-display mb-8 text-2xl md:text-3xl">Collections</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link key={c.handle} href={`/collections/${c.handle}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden bg-ivory-deep">
              {c.image ? (
                <Image
                  src={c.image.url}
                  alt={c.image.altText || c.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 flex items-end bg-charcoal/20 p-5">
                <h2 className="font-display text-xl text-ivory">{c.title}</h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
