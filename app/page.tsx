import { getProducts } from "@/lib/shopify/products";
import { getCollectionByHandle } from "@/lib/shopify/collections";
import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/home/marquee";
import { ShopByPurpose, ShopByCapacity } from "@/components/home/shop-by";
import { ProductGridSection } from "@/components/home/product-grid-section";
import { Craftsmanship } from "@/components/home/craftsmanship";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { FaqPreview } from "@/components/home/faq-preview";
import { FinalCta } from "@/components/home/final-cta";

export default async function HomePage() {
  const [bestSellers, newArrivals, allProducts] = await Promise.all([
    getCollectionByHandle("best-sellers"),
    getCollectionByHandle("new-arrivals"),
    getProducts({ first: 8 }),
  ]);

  return (
    <>
      <Hero />
      <Marquee />
      <ProductGridSection
        title="Featured Bags"
        subtitle="A starting point — the bags people ask about most."
        products={allProducts}
        viewAllHref="/shop"
      />
      <ShopByPurpose />
      {bestSellers && bestSellers.products.length > 0 ? (
        <ProductGridSection title="Best Sellers" products={bestSellers.products} viewAllHref="/collections/best-sellers" />
      ) : null}
      <Craftsmanship />
      <ShopByCapacity />
      {newArrivals && newArrivals.products.length > 0 ? (
        <ProductGridSection title="New Arrivals" products={newArrivals.products} viewAllHref="/collections/new-arrivals" />
      ) : null}
      <WhyChooseUs />
      <FaqPreview />
      <FinalCta />
    </>
  );
}
