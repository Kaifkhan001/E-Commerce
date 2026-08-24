import "server-only";
import { shippingConfig } from "./config";
import type { ServiceabilityResult } from "./types";

// Endpoints per Shiprocket's public API docs (https://apidocs.shiprocket.in/).
// Verify against current docs if Shiprocket changes their API surface —
// these are stable as of this writing but not contractually guaranteed.
const AUTH_URL = "https://apiv2.shiprocket.in/v1/external/auth/login";
const SERVICEABILITY_URL = "https://apiv2.shiprocket.in/v1/external/courier/serviceability/";

// Shiprocket tokens are long-lived (documented ~10 days). Cache in-memory
// per server process rather than re-authenticating on every request. This
// cache does not persist across serverless cold starts / deployments —
// that's fine, it just re-authenticates on the next request.
let cachedToken: { token: string; fetchedAt: number } | null = null;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 9; // refresh a day before Shiprocket's ~10-day expiry

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() - cachedToken.fetchedAt < TOKEN_TTL_MS) {
    return cachedToken.token;
  }

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: shippingConfig.shiprocket.email,
      password: shippingConfig.shiprocket.password,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Shiprocket auth failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error("Shiprocket auth response did not include a token");
  }

  cachedToken = { token: data.token, fetchedAt: Date.now() };
  return data.token;
}

export async function checkShiprocketServiceability(
  deliveryPincode: string,
  weightKg = 0.5,
  cod = false
): Promise<ServiceabilityResult> {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      pickup_postcode: shippingConfig.shiprocket.pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: String(weightKg),
      cod: cod ? "1" : "0",
    });

    const response = await fetch(`${SERVICEABILITY_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Shiprocket serviceability check failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const couriers = data?.data?.available_courier_companies as
      | { etd?: string; estimated_delivery_days?: string | number; cod?: number; courier_name?: string }[]
      | undefined;

    if (!couriers || couriers.length === 0) {
      return { configured: true, serviceable: false, estimatedDays: null, codAvailable: false, courierName: null };
    }

    // Prefer the fastest option Shiprocket returns.
    const best = couriers[0];
    const estimatedDays = best.estimated_delivery_days ? Number(best.estimated_delivery_days) : null;

    return {
      configured: true,
      serviceable: true,
      estimatedDays: Number.isFinite(estimatedDays) ? estimatedDays : null,
      codAvailable: couriers.some((c) => c.cod === 1),
      courierName: best.courier_name ?? null,
    };
  } catch (err) {
    return { configured: false, error: err instanceof Error ? err.message : "Serviceability check failed" };
  }
}
