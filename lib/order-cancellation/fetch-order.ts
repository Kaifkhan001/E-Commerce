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
          id
          kind
          status
          gateway
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
        id: string;
        kind: string;
        status: string;
        gateway: string;
        manualPaymentGateway: boolean;
        amountSet: { shopMoney: { amount: string } };
      }[];
    }[];
  };
};

/** A real, captured payment we could target with a refund — see CapturedTransaction below. */
export type CapturedTransaction = {
  id: string;
  gateway: string;
  amountPaise: number;
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
  /**
   * The individual transactions capturedPaise is summed from — i.e. real
   * money actually captured through an automatic (non-manual) gateway,
   * never a pending/failed attempt or a manual COD "transaction". A refund
   * must target one of THESE specific transactions (Shopify's refundCreate
   * takes a parent transaction id, not just an amount) — see
   * lib/order-cancellation/cancel-order.ts. In every real order this store
   * has produced there has been exactly one; more than one (e.g. a split
   * capture) is a genuine edge case the refund-first flow refuses to guess
   * at rather than picking one arbitrarily.
   */
  capturedTransactions: CapturedTransaction[];
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
  const capturedTransactions: CapturedTransaction[] = order.transactions
    .filter((t) => (t.kind === "SALE" || t.kind === "CAPTURE") && t.status === "SUCCESS" && !t.manualPaymentGateway)
    .map((t) => ({ id: t.id, gateway: t.gateway, amountPaise: decimalStringToPaise(t.amountSet.shopMoney.amount) }));
  const capturedPaise = capturedTransactions.reduce((sum, t) => sum + t.amountPaise, 0);

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
      capturedTransactions,
    },
  };
}
