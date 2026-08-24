// Configuration for the pincode serviceability checker (Section: delivery
// partner integration). This is deliberately scoped to serviceability
// checks only — actual order fulfillment (AWB generation, pickup,
// tracking) happens via a Shopify Admin app (Shiprocket/Delhivery), not
// this codebase. See README "Delivery partner setup" for why.

function isTruthy(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

export type ShippingProvider = "shiprocket" | "none";

const provider = (process.env.SHIPPING_PROVIDER as ShippingProvider) || "none";

export const shippingConfig = {
  provider,
  enabled: provider !== "none" && !isTruthy(process.env.SHIPPING_DISABLED),
  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL ?? "",
    password: process.env.SHIPROCKET_PASSWORD ?? "",
    // The pincode your warehouse/pickup location ships from — required by
    // Shiprocket's serviceability API to calculate real distance-based
    // availability, not just a generic yes/no.
    pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE ?? "",
  },
};

export function shippingConfiguredCorrectly(): boolean {
  if (shippingConfig.provider === "shiprocket") {
    return Boolean(
      shippingConfig.shiprocket.email && shippingConfig.shiprocket.password && shippingConfig.shiprocket.pickupPincode
    );
  }
  return false;
}
