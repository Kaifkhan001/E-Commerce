import "server-only";
import { adminApiConfigured, shopifyAdminFetch } from "@/lib/shopify/admin-client";
import { getDeliveryEstimate } from "./delivery-estimates";
import { computeTrackingStatus, type TrackingStatus } from "./compute-status";

// Order history for the logged-in user's account page. Deliberately capped
// at a fixed page size rather than fetched unbounded — see ORDER_HISTORY_LIMIT.
const ORDER_HISTORY_LIMIT = 20;

// shippingLine/lineItems.image/displayFinancialStatus are all fields on the
// Order/LineItem objects themselves (not on Customer), so they're covered
// by the read_orders scope this app already has.
const ORDERS_BY_EMAIL_QUERY = `
  query OrdersByEmail($query: String!, $first: Int!) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        createdAt
        email
        displayFinancialStatus
        displayFulfillmentStatus
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

type OrdersByEmailResponse = {
  orders: {
    nodes: {
      id: string;
      name: string;
      createdAt: string;
      email: string | null;
      displayFinancialStatus: string | null;
      displayFulfillmentStatus: string;
      shippingLine: { title: string } | null;
      lineItems: {
        nodes: { title: string; quantity: number; image: { url: string; altText: string | null } | null }[];
      };
      totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
    }[];
  };
};

export type OrderSummary = {
  name: string;
  date: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  items: { title: string; quantity: number; imageUrl: string | null; imageAlt: string | null }[];
  total: { amount: string; currencyCode: string };
  tracking: TrackingStatus;
};

export type OrderHistoryResult = { ok: true; orders: OrderSummary[]; limit: number } | { ok: false; reason: "not_configured" | "error" };

/**
 * Order history for one customer, keyed strictly by their own email — the
 * caller must pass an email sourced from the authenticated session
 * (never a client-supplied value). Filters server-side via Shopify's
 * `email:` search AND re-verifies each returned order's own `email` field
 * matches, exactly like lib/order-tracking/lookup-order.ts does — never
 * trust the search filter alone as the security boundary.
 */
export async function listOrdersForEmail(email: string): Promise<OrderHistoryResult> {
  if (!adminApiConfigured) {
    return { ok: false, reason: "not_configured" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: true, orders: [], limit: ORDER_HISTORY_LIMIT };
  }

  try {
    const data = await shopifyAdminFetch<OrdersByEmailResponse>(ORDERS_BY_EMAIL_QUERY, {
      query: `email:${normalizedEmail}`,
      first: ORDER_HISTORY_LIMIT,
    });

    const orders = data.orders.nodes
      .filter((order) => (order.email ?? "").trim().toLowerCase() === normalizedEmail)
      .map((order): OrderSummary => {
        const shippingRateName = order.shippingLine?.title ?? null;
        const estimate = getDeliveryEstimate(shippingRateName);
        const tracking = computeTrackingStatus({
          orderCreatedAt: new Date(order.createdAt),
          isFulfilled: order.displayFulfillmentStatus === "FULFILLED",
          shippingRateName,
          estimate,
        });

        return {
          name: order.name,
          date: order.createdAt,
          financialStatus: order.displayFinancialStatus,
          fulfillmentStatus: order.displayFulfillmentStatus,
          items: order.lineItems.nodes.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            imageUrl: item.image?.url ?? null,
            imageAlt: item.image?.altText ?? null,
          })),
          total: order.totalPriceSet.shopMoney,
          tracking,
        };
      });

    return { ok: true, orders, limit: ORDER_HISTORY_LIMIT };
  } catch {
    // Never leak internal error details or Admin API responses.
    return { ok: false, reason: "error" };
  }
}
