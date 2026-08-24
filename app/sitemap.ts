import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/shopify/products";
import { getCollections } from "@/lib/shopify/collections";
import { siteConfig } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes = [
    "", "/shop", "/collections", "/search", "/about", "/contact", "/faq", "/shipping", "/returns", "/privacy", "/terms",
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  const [products, collections] = await Promise.all([getProducts({ first: 250 }), getCollections()]);

  const productRoutes = products.map((p) => ({ url: `${base}/products/${p.handle}`, lastModified: new Date() }));
  const collectionRoutes = collections.map((c) => ({ url: `${base}/collections/${c.handle}`, lastModified: new Date() }));

  return [...staticRoutes, ...productRoutes, ...collectionRoutes];
}
