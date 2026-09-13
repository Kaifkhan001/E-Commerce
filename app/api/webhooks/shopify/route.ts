import { NextResponse } from "next/server";
import { verifyShopifyWebhookSignature } from "@/lib/wallet/verify-webhook";
import { calculateCashbackPaise, cashbackExpiryDate, decimalStringToPaise, normalizeEmail } from "@/lib/wallet/money";
import {
  getEarnedTransactionForOrder,
  insertEarnedTransaction,
  insertReversalForOrder,
  reverseFullOrderCredit,
} from "@/lib/wallet/ledger";

// Webhook receiver for Shopify order events that drive wallet cashback.
// See README "Wallet cashback webhooks" for which topics to register in
// Shopify Admin and where to find the signing secret.

type ShopifyOrderPayload = {
  id: number | string;
  email?: string | null;
  contact_email?: string | null;
  customer?: { email?: string | null } | null;
  current_subtotal_price?: string | null;
  subtotal_price?: string | null;
};

type ShopifyRefundLineItem = {
  subtotal?: string | null;
};

type ShopifyRefundPayload = {
  id: number | string;
  order_id: number | string;
  refund_line_items?: ShopifyRefundLineItem[] | null;
};

function toOrderGid(numericId: number | string): string {
  return `gid://shopify/Order/${numericId}`;
}

function extractOrderEmail(order: ShopifyOrderPayload): string | null {
  const raw = order.email || order.contact_email || order.customer?.email || null;
  return raw ? normalizeEmail(raw) : null;
}

async function handleOrderPaid(order: ShopifyOrderPayload) {
  const shopifyOrderId = toOrderGid(order.id);
  const email = extractOrderEmail(order);

  if (!email) {
    console.warn(`[wallet webhook] orders/paid for ${shopifyOrderId} has no email — skipping, nothing to credit.`);
    return NextResponse.json({ ok: true, skipped: "no-email" });
  }

  const subtotalRaw = order.current_subtotal_price ?? order.subtotal_price;
  if (!subtotalRaw) {
    console.warn(`[wallet webhook] orders/paid for ${shopifyOrderId} has no subtotal — skipping.`);
    return NextResponse.json({ ok: true, skipped: "no-subtotal" });
  }

  const subtotalPaise = decimalStringToPaise(subtotalRaw);
  const cashbackPaise = calculateCashbackPaise(subtotalPaise);

  if (cashbackPaise <= 0) {
    return NextResponse.json({ ok: true, skipped: "zero-cashback" });
  }

  const result = await insertEarnedTransaction({
    email,
    amountPaise: cashbackPaise,
    shopifyOrderId,
    expiresAt: cashbackExpiryDate(),
    note: `5% cashback on order ${shopifyOrderId} (subtotal ${subtotalRaw})`,
  });

  if (!result.inserted) {
    // Duplicate delivery of an order we already credited — this is success
    // from Shopify's point of view, not an error. Returning 200 (instead
    // of a 409/500) tells Shopify to stop retrying.
    console.info(`[wallet webhook] duplicate orders/paid for ${shopifyOrderId} — already credited, no-op.`);
    return NextResponse.json({ ok: true, duplicate: true });
  }

  return NextResponse.json({ ok: true, credited: cashbackPaise });
}

async function handleOrderCancelled(order: ShopifyOrderPayload) {
  const shopifyOrderId = toOrderGid(order.id);
  const earned = await getEarnedTransactionForOrder(shopifyOrderId);

  if (!earned) {
    // Never credited (e.g. cancelled before payment, or email was missing
    // at earn time) — nothing to reverse.
    return NextResponse.json({ ok: true, skipped: "nothing-to-reverse" });
  }

  const result = await reverseFullOrderCredit({
    email: earned.email,
    shopifyOrderId,
    note: `reversed: order ${shopifyOrderId} cancelled`,
  });

  if (!result.inserted) {
    if (result.reason === "nothing-to-reverse") {
      // Already fully reversed by an earlier event for this order.
      return NextResponse.json({ ok: true, skipped: "already-reversed" });
    }
    // reason === "conflict": a 'reversed' row already exists for this order
    // (e.g. an earlier partial refund already used the one reversal slot
    // the current schema allows) and we cannot safely tell whether this is
    // a harmless retry of that same event or a new one. Fail loudly rather
    // than guess — see lib/wallet/ledger.ts for the full explanation.
    console.error(
      `[wallet webhook] orders/cancelled for ${shopifyOrderId}: a reversal already exists for this order and ` +
        `the current schema cannot record a second one. Needs manual review — see lib/wallet/ledger.ts.`
    );
    return NextResponse.json({ ok: false, error: "reversal-conflict" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reversed: result.amountPaise });
}

async function handleRefundCreate(refund: ShopifyRefundPayload) {
  const shopifyOrderId = toOrderGid(refund.order_id);
  const earned = await getEarnedTransactionForOrder(shopifyOrderId);

  if (!earned) {
    return NextResponse.json({ ok: true, skipped: "nothing-to-reverse" });
  }

  const refundedSubtotalPaise = (refund.refund_line_items ?? []).reduce((sum, item) => {
    if (!item.subtotal) return sum;
    return sum + decimalStringToPaise(item.subtotal);
  }, 0);

  const reversalAmountPaise = calculateCashbackPaise(refundedSubtotalPaise);

  if (reversalAmountPaise <= 0) {
    // e.g. a shipping-only or tax-only refund — no cashback was ever paid
    // on that portion, so there's nothing to claw back.
    return NextResponse.json({ ok: true, skipped: "zero-reversal" });
  }

  const result = await insertReversalForOrder({
    email: earned.email,
    shopifyOrderId,
    requestedAmountPaise: reversalAmountPaise,
    note: `reversed: refund on order ${shopifyOrderId} (refunded subtotal ${(refundedSubtotalPaise / 100).toFixed(2)})`,
  });

  if (!result.inserted) {
    if (result.reason === "nothing-to-reverse") {
      return NextResponse.json({ ok: true, skipped: "already-reversed" });
    }
    console.error(
      `[wallet webhook] refunds/create for order ${shopifyOrderId} (refund ${refund.id}): a reversal already ` +
        `exists for this order and the current schema cannot record a second one (e.g. a second partial refund). ` +
        `Needs manual review — see lib/wallet/ledger.ts.`
    );
    return NextResponse.json({ ok: false, error: "reversal-conflict" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reversed: result.amountPaise });
}

export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[wallet webhook] SHOPIFY_WEBHOOK_SECRET is not set — refusing all webhook requests.");
    return NextResponse.json({ ok: false, error: "webhook-not-configured" }, { status: 500 });
  }

  // Read the RAW body first — verification must happen against these exact
  // bytes, before any JSON parsing (see verify-webhook.ts).
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");

  if (!verifyShopifyWebhookSignature(rawBody, hmacHeader, secret)) {
    return NextResponse.json({ ok: false, error: "invalid-signature" }, { status: 401 });
  }

  const topic = request.headers.get("X-Shopify-Topic");

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  switch (topic) {
    case "orders/paid":
      return handleOrderPaid(payload as ShopifyOrderPayload);
    case "orders/cancelled":
      return handleOrderCancelled(payload as ShopifyOrderPayload);
    case "refunds/create":
      return handleRefundCreate(payload as ShopifyRefundPayload);
    default:
      // A topic we haven't registered for (or Shopify's periodic ping).
      // Acknowledge so Shopify doesn't retry, but log it since it means
      // either config drift in Shopify Admin or a topic this code doesn't
      // know about yet.
      console.warn(`[wallet webhook] received unhandled topic: ${topic ?? "(none)"}`);
      return NextResponse.json({ ok: true, skipped: "unhandled-topic" });
  }
}
