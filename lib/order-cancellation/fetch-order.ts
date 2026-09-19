import "server-only";
import { adminApiConfigured, shopifyAdminFetch } from "@/lib/shopify/admin-client";
import { decimalStringToPaise } from "@/lib/wallet/money";

// Fetches exactly the fields cancellation logic needs, re-verified fresh
// from Shopify every time this is called — see eligibility.ts for why this
// must never be cached or reused across a page-load and the later submit.
// Deliberately its own query (not shared with lib/order-tracking) so this
// feature can evolve independently and never accidentally weakens or is
// weakened by /track-order's read-only lookup.
const ORDER_FOR_CANCELLATION_QUERY = `
  query OrderForCancellation($query: String!) {
    orders(first: 1, query: $query) {
      nodes {
        id
        name
        email
        cancelledAt
        displayFulfillmentStatus
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalRefundedSet {
          shopMoney {
            amount
          }
        }
        transactions(first: 20) {
          kind
          status
          manualPaymentGateway
          amountSet {
            shopMoney {
              amount
            }
          }
        }
      }
    }
  }
`;

type OrderForCancellationResponse = {
  orders: {
    nodes: {
      id: string;
      name: string;
      email: string | null;
      cancelledAt: string | null;
      displayFulfillmentStatus: string;
      totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
      totalRefundedSet: { shopMoney: { amount: string } };
      transactions: {
        kind: string;
        status: string;
        manualPaymentGateway: boolean;
        amountSet: { shopMoney: { amount: string } };
      }[];
    }[];
  };
};

export type CancellableOrder = {
  id: string;
  name: string;
  email: string;
  cancelledAt: string | null;
  fulfillmentStatus: string;
  totalPaise: number;
  currencyCode: string;
  /** Sum of successfully CAPTURED payment through an automatic (non-manual) gateway — see determineRefundNeeded. */
  capturedPaise: number;
  refundedPaise: number;
};

export type FetchOrderResult =
  | { found: false; reason: "not_configured" | "not_found" | "email_mismatch" }
  | { found: true; order: CancellableOrder };

/**
 * The single source of truth for "what does Shopify say about this order
 * right now" for the cancellation feature. Every caller — the page render
 * AND the cancel/request-cancellation API routes — calls this fresh; never
 * pass a `CancellableOrder` across a request boundary and trust it's still
 * accurate (see eligibility.ts).
 */
export async function fetchOrderForCancellation(orderNumber: string, email: string): Promise<FetchOrderResult> {
  if (!adminApiConfigured) {
    return { found: false, reason: "not_configured" };
  }

  const cleanedOrderNumber = orderNumber.trim().replace(/^#/, "");
  const suppliedEmail = email.trim().toLowerCase();

  const data = await shopifyAdminFetch<OrderForCancellationResponse>(ORDER_FOR_CANCELLATION_QUERY, {
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

  // A payment actually captured through an automatic gateway (Razorpay) —
  // never a manual one (Cash on Delivery), and never just an authorization
  // or a pending/failed attempt. This is what distinguishes "prepaid, needs
  // a real refund" from "COD, nothing was ever collected" — checked
  // structurally (manualPaymentGateway + status), never by string-matching
  // a gateway display name, since that's merchant-configurable text.
  const capturedPaise = order.transactions
    .filter((t) => (t.kind === "SALE" || t.kind === "CAPTURE") && t.status === "SUCCESS" && !t.manualPaymentGateway)
    .reduce((sum, t) => sum + decimalStringToPaise(t.amountSet.shopMoney.amount), 0);

  return {
    found: true,
    order: {
      id: order.id,
      name: order.name,
      email: orderEmail,
      cancelledAt: order.cancelledAt,
      fulfillmentStatus: order.displayFulfillmentStatus,
      totalPaise: decimalStringToPaise(order.totalPriceSet.shopMoney.amount),
      currencyCode: order.totalPriceSet.shopMoney.currencyCode,
      capturedPaise,
      refundedPaise: decimalStringToPaise(order.totalRefundedSet.shopMoney.amount),
    },
  };
}
