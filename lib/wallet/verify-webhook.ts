import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies Shopify's `X-Shopify-Hmac-Sha256` header against the RAW request
 * body bytes.
 *
 * This MUST be called with the untouched raw body text, before any JSON
 * parsing — parsing and re-serializing produces different bytes (different
 * key order, spacing, number formatting) and would make this check either
 * silently fail for legitimate requests or be trivially bypassable, since
 * an attacker could send a payload that re-serializes to whatever they
 * want. An unverified endpoint here is effectively a public "give me free
 * money" API, so this is the highest-risk code in the wallet feature.
 */
export function verifyShopifyWebhookSignature(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;

  const computedDigest = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const providedDigest = Buffer.from(hmacHeader, "base64");

  // timingSafeEqual throws on a length mismatch rather than returning
  // false, so check that first. Comparing lengths isn't itself sensitive —
  // the header is base64 of a fixed-size SHA-256 digest, so its length
  // reveals nothing an attacker doesn't already know.
  if (providedDigest.length !== computedDigest.length) return false;

  return timingSafeEqual(computedDigest, providedDigest);
}
