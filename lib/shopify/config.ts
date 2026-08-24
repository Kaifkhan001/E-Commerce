// Central environment configuration + validation.
// Import this instead of reading process.env directly elsewhere, so every
// environment mistake surfaces as one clear error instead of scattered
// undefined-value bugs.

function isTruthy(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

// SHOPIFY_ENABLED gates whether we talk to the real Storefront API or serve
// mock data. Defaults to disabled so the app runs out of the box before
// credentials exist.
export const shopifyEnabled = isTruthy(process.env.SHOPIFY_ENABLED);

const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-04";

if (shopifyEnabled && (!storeDomain || !storefrontToken)) {
  throw new Error(
    "SHOPIFY_ENABLED=true but SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN " +
      "is missing. Set both in your environment, or set SHOPIFY_ENABLED=false to run " +
      "in mock mode. See .env.example."
  );
}

export const shopifyConfig = {
  enabled: shopifyEnabled,
  storeDomain: storeDomain ?? "",
  storefrontToken: storefrontToken ?? "",
  apiVersion,
  get endpoint() {
    return `https://${this.storeDomain}/api/${this.apiVersion}/graphql.json`;
  },
};
