import "server-only";
import { shippingConfig, shippingConfiguredCorrectly } from "./config";
import { checkShiprocketServiceability } from "./shiprocket";
import type { ServiceabilityResult } from "./types";

export async function checkPincodeServiceability(
  pincode: string,
  weightKg = 0.5,
  cod = false
): Promise<ServiceabilityResult> {
  if (!shippingConfig.enabled || !shippingConfiguredCorrectly()) {
    return { configured: false };
  }

  if (shippingConfig.provider === "shiprocket") {
    return checkShiprocketServiceability(pincode, weightKg, cod);
  }

  // Delhivery is documented as a supported alternative (see README
  // "Delivery partner setup") but not implemented here — its API auth
  // model differs enough (API key header vs Shiprocket's login-token flow)
  // that it deserves its own verified implementation rather than a guess.
  // Add lib/shipping/delhivery.ts and wire it in here when needed.
  return { configured: false };
}
