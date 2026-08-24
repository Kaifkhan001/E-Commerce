import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Shopify CDN — required once real Shopify product images are used.
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Interim bag photography (real Unsplash License photos), still used for
      // Atlas Work Tote, Transit Gym Duffel, Lumen Camera Sling, and Everyday
      // Crossbody — no real tote/duffel/sling/crossbody photo exists yet in
      // /public/images (only backpack photos were provided). Remove once no
      // component references images.unsplash.com anymore.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
