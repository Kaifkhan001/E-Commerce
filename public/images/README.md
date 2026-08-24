# Real product photography

Drop your actual product photos here as:

    Product-Image-01.jpeg
    Product-Image-02.jpeg
    ...
    Product-Image-07.jpeg

Once present, update `lib/shopify/mock-data.ts`: replace the `unsplash(...)`
calls with local paths, e.g.:

    featuredImage: { url: "/images/Product-Image-01.jpeg", altText: "...", width: 1200, height: 1500 },

next/image serves local files from /public automatically (no remotePatterns
entry needed) and still applies automatic format negotiation (WebP/AVIF)
and responsive resizing — no manual conversion required.
