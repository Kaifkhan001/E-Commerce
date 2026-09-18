import "server-only";
import { adminApiConfigured, shopifyAdminFetch } from "@/lib/shopify/admin-client";
import { getDeliveryEstimate } from "./delivery-estimates";
import { computeTrackingStatus, SHIPPED_AFTER_DAYS, type TrackingStatus } from "./compute-status";

// shippingAddress and lineItems.image are fields on the Order/LineItem
// objects themselves (not on Customer), so both are covered by the
// read_orders scope this app already has — neither requires read_customers.
const ORDER_QUERY = `
  query OrderByName($query: String!) {
    orders(first: 1, query: $query) {
      nodes {
        id
        name
        createdAt
        displayFulfillmentStatus
        email
        shippingAddress {
          city
          province
          zip
        }
        shippingLine {
          title
        }
        lineItems(first: 10) {
          nodes {
            title
            quantity
            image {
              url
              altText
            }
          }
        }
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

type OrderQueryResponse = {
  orders: {
    nodes: {
      id: string;
      name: string;
      createdAt: string;
      displayFulfillmentStatus: string;
      email: string | null;
      shippingAddress: { city: string | null; province: string | null; zip: string | null } | null;
      shippingLine: { title: string } | null;
      lineItems: {
        nodes: { title: string; quantity: number; image: { url: string; altText: string | null } | null }[];
      };
      totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
    }[];
  };
};

export type TrackingStageDates = {
  placed: string;
  shipped: string;
  outForDelivery: string;
};

export type OrderLookupResult =
  | { found: false; reason: "not_configured" | "not_found" | "email_mismatch" }
  | {
      found: true;
      order: {
        name: string;
        date: string;
        items: { title: string; quantity: number; imageUrl: string | null; imageAlt: string | null }[];
        total: { amount: string; currencyCode: string };
        shippingAddress: { city: string; province: string; zip: string } | null;
      };
      tracking: TrackingStatus;
      stageDates: TrackingStageDates;
    };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Presentation-only dates for the three non-final stages, derived from the
// same inputs computeTrackingStatus already uses (order date + the delivery
// estimate window) — this does not change which stage is considered
// active, it only labels the stepper. "Delivered"'s date is already
// tracking.estimatedDeliveryByDate (order date + estimate.maxDays).
function computeStageDates(orderCreatedAt: Date, estimate: { minDays: number; maxDays: number }): TrackingStageDates {
  return {
    placed: orderCreatedAt.toISOString(),
    shipped: new Date(orderCreatedAt.getTime() + SHIPPED_AFTER_DAYS * MS_PER_DAY).toISOString(),
    outForDelivery: new Date(orderCreatedAt.getTime() + estimate.minDays * MS_PER_DAY).toISOString(),
  };
}

export async function lookupOrderStatus(orderNumber: string, email: string): Promise<OrderLookupResult> {
  if (!adminApiConfigured) {
    return { found: false, reason: "not_configured" };
  }

  const cleanedOrderNumber = orderNumber.trim().replace(/^#/, "");
  const suppliedEmail = email.trim().toLowerCase();

  const data = await shopifyAdminFetch<OrderQueryResponse>(ORDER_QUERY, {
    query: `name:#${cleanedOrderNumber}`,
  });

  const order = data.orders.nodes[0];
  if (!order) {
    return { found: false, reason: "not_found" };
  }

  const orderEmail = (order.email ?? "").trim().toLowerCase();
  if (!orderEmail || orderEmail !== suppliedEmail) {
    return { found: false, reason: "email_mismatch" };
  }

  const shippingRateName = order.shippingLine?.title ?? null;
  const estimate = getDeliveryEstimate(shippingRateName);
  const orderCreatedAt = new Date(order.createdAt);
  const tracking = computeTrackingStatus({
    orderCreatedAt,
    isFulfilled: order.displayFulfillmentStatus === "FULFILLED",
    shippingRateName,
    estimate,
  });

  const address = order.shippingAddress;
  const shippingAddress =
    address && address.city && address.province && address.zip
      ? { city: address.city, province: address.province, zip: address.zip }
      : null;

  return {
    found: true,
    order: {
      name: order.name,
      date: orderCreatedAt.toISOString(),
      items: order.lineItems.nodes.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        imageUrl: item.image?.url ?? null,
        imageAlt: item.image?.altText ?? null,
      })),
      total: order.totalPriceSet.shopMoney,
      shippingAddress,
    },
    tracking,
    stageDates: computeStageDates(orderCreatedAt, estimate),
  };
}
