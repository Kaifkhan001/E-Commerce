import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductByHandle, getProducts } from "@/lib/shopify/products";
import { formatMoney, discountPercent } from "@/lib/utils/format";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartForm } from "@/components/product/add-to-cart-form";
import { ProductSpecs } from "@/components/product/product-specs";
import { PincodeChecker } from "@/components/product/pincode-checker";
import { ProductGridSection } from "@/components/home/product-grid-section";
import { AnalyticsPageEvent } from "@/components/analytics-page-event";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return {};

  return {
    title: product.title,
    description: product.description || `${product.title} — ${siteConfig.name}`,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.featuredImage ? [{ url: product.featuredImage.url }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const discount = discountPercent(product.priceRange.min, product.compareAtPriceRange?.min);
  const related = (await getProducts({ first: 8 })).filter((p) => p.handle !== product.handle).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: product.vendor || siteConfig.name },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: product.priceRange.min.currencyCode,
      lowPrice: product.priceRange.min.amount,
      highPrice: product.priceRange.max.amount,
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-brand py-8 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AnalyticsPageEvent
        event="view_item"
        params={{ item_id: product.id, item_name: product.title, price: product.priceRange.min.amount }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-charcoal-soft">
        <a href="/shop" className="hover:text-charcoal">Shop</a> / <span>{product.title}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <h1 className="font-display text-2xl md:text-3xl">{product.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className={discount ? "text-sale text-lg" : "text-lg"}>{formatMoney(product.priceRange.min)}</span>
            {product.compareAtPriceRange?.min ? (
              <span className="text-charcoal-soft/70 line-through">{formatMoney(product.compareAtPriceRange.min)}</span>
            ) : null}
            {discount ? <span className="text-sm text-sale">Save {discount}%</span> : null}
          </div>

          {product.description ? <p className="mt-5 text-charcoal-soft">{product.description}</p> : null}

          <div className="mt-7">
            <AddToCartForm product={product} />
          </div>

          <div className="mt-6">
            <PincodeChecker weightKg={product.specs.weightGrams ? product.specs.weightGrams / 1000 : 0.5} />
          </div>

          <div className="mt-8 space-y-2 border-t border-border pt-6 text-sm text-charcoal-soft">
            <p>Free shipping on prepaid orders over ₹2,999.</p>
            <p>See our <a href="/shipping" className="underline underline-offset-2 hover:text-charcoal">shipping</a> and <a href="/returns" className="underline underline-offset-2 hover:text-charcoal">returns</a> policies.</p>
          </div>

          <div className="mt-8">
            <ProductSpecs specs={product.specs} />
          </div>
        </div>
      </div>

      {related.length > 0 ? <ProductGridSection title="You Might Also Like" products={related} /> : null}
    </div>
  );
}
