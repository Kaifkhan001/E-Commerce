import "server-only";
import { adminApiConfigured, shopifyAdminFetch } from "@/lib/shopify/admin-client";
import { getDeliveryEstimate } from "./delivery-estimates";
import { computeTrackingStatus, type TrackingStatus } from "./compute-status";

const ORDER_QUERY = `
  query OrderByName($query: String!) {
    orders(first: 1, query: $query) {
      nodes {
        id
        name
        createdAt
        displayFulfillmentStatus
        email
        shippingLine {
          title
        }
        lineItems(first: 10) {
          nodes {
            title
            quantity
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
      shippingLine: { title: string } | null;
      lineItems: { nodes: { title: string; quantity: number }[] };
      totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
    }[];
  };
};

export type OrderLookupResult =
  | { found: false; reason: "not_configured" | "not_found" | "email_mismatch" }
  | {
      found: true;
      order: {
        name: string;
        items: { title: string; quantity: number }[];
        total: { amount: string; currencyCode: string };
      };
      tracking: TrackingStatus;
    };

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
  const tracking = computeTrackingStatus({
    orderCreatedAt: new Date(order.createdAt),
    isFulfilled: order.displayFulfillmentStatus === "FULFILLED",
    shippingRateName,
    estimate,
  });

  return {
    found: true,
    order: {
      name: order.name,
      items: order.lineItems.nodes,
      total: order.totalPriceSet.shopMoney,
    },
    tracking,
  };
}
