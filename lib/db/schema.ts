import { index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// Auth.js (NextAuth) Drizzle adapter schema — table/column names and types
// follow the official adapter's default Postgres schema exactly:
// https://authjs.dev/getting-started/adapters/drizzle
// Do not rename columns here without also updating the adapter wiring in
// lib/auth/auth.ts, since the adapter matches columns by name.

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

// Backs the authenticated-user wishlist — see lib/wishlist/db.ts. Anonymous
// visitors still use localStorage only (features/wishlist/wishlist-context.tsx);
// rows here only ever exist for a signed-in account.
export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shopifyProductId: text("shopifyProductId").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("wishlist_items_user_idx").on(table.userId),
    // The real dedup guard for merging a local (anonymous) wishlist into an
    // account on login — an insert for a product already saved collides
    // with this instead of creating a duplicate row. See
    // lib/wishlist/db.ts mergeWishlistItems, which relies on this via
    // onConflictDoNothing rather than an application-level existence check.
    userProductUnique: uniqueIndex("wishlist_items_user_product_unique").on(table.userId, table.shopifyProductId),
  })
);

// --------------------------------------------------------------------------
// Wallet cashback ledger (APPEND-ONLY — see lib/wallet/balance.ts).
//
// There is deliberately no mutable "balance" column anywhere in this schema.
// A user's balance is always the sum of their rows here, computed on read.
// This makes every rupee traceable to a specific order/refund event, and
// lets mistakes be fixed with a compensating row instead of silently
// editing a number with no history.
//
// Wallets are keyed by NORMALIZED EMAIL (lowercased, trimmed), not by
// NextAuth user id — see lib/wallet/money.ts `normalizeEmail`. Customers
// check out on Shopify's hosted checkout as guests, so the order email is
// the only reliable link back to them; a logged-in user's balance is looked
// up by their account email, not a foreign key to `users`.
export const walletTransactionTypeEnum = pgEnum("wallet_transaction_type", [
  "earned",
  "redeemed",
  "expired",
  "reversed",
]);

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    // Smallest currency unit (paise). Positive = credit, negative = debit.
    // Never store money as a float anywhere in this feature.
    amountPaise: integer("amountPaise").notNull(),
    type: walletTransactionTypeEnum("type").notNull(),
    // Shopify order GID/numeric id this row relates to. Nullable so a
    // future manual adjustment (support crediting/debiting outside an
    // order context) has somewhere to live without a fake order id.
    shopifyOrderId: text("shopifyOrderId"),
    // Uniquely identifies the SOURCE EVENT that produced this row — not the
    // order, the event. For 'earned' this is the order id itself (an order
    // is only ever paid once). For 'reversed' via cancellation it's
    // `cancel:<orderId>` (an order is only ever cancelled once). For
    // 'reversed' via refund it's the refund's own GID, since one order can
    // have many refunds. This is what makes the unique constraint below
    // work for BOTH idempotency (retry of the exact same event is rejected)
    // AND multiple distinct reversal events per order (a second, different
    // partial refund gets its own row instead of colliding with the
    // first) — (shopifyOrderId, type) alone can't do both at once, because
    // "one row per order" and "one row per event, of which an order can
    // have several" are different constraints. Nullable for the same
    // reason shopifyOrderId is (a future one-off manual adjustment), but
    // every webhook-driven insert in lib/wallet/ledger.ts always sets it.
    sourceEventId: text("sourceEventId"),
    // Set for 'earned' rows only — when that credit stops being spendable.
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    // Human-readable explanation for auditing (e.g. "5% cashback on order
    // #1234" or "reversed: order #1234 cancelled").
    note: text("note"),
  },
  (table) => ({
    emailIdx: index("wallet_transactions_email_idx").on(table.email),
    // Primary idempotency guard: a webhook retry or duplicate delivery of
    // the same source event can never insert a second row for it, while a
    // genuinely different event (e.g. a second partial refund) for the
    // same order is still allowed. See lib/wallet/ledger.ts.
    orderTypeEventUnique: uniqueIndex("wallet_transactions_order_type_event_unique").on(
      table.shopifyOrderId,
      table.type,
      table.sourceEventId
    ),
  })
);

// --------------------------------------------------------------------------
// Customer self-service order cancellation.
//
// Shopify itself has no notion of a "cancellation requested but not yet
// acted on" state — an order is either cancelled or it isn't. For a
// fulfilled/partially-fulfilled order we deliberately never auto-cancel (see
// app/api/account/orders/[orderNumber]/request-cancellation/route.ts), so
// the fact that a customer asked only exists if we record it ourselves.
// This table exists purely so (a) the order detail page can show "you asked
// on <date>" instead of the request button again after a reload, and (b) a
// unique constraint on the order stops repeated clicks/reloads from sending
// the store owner a duplicate email for the same order.
export const cancellationRequests = pgTable(
  "cancellation_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    shopifyOrderId: text("shopifyOrderId").notNull(),
    orderName: text("orderName").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("cancellation_requests_email_idx").on(table.email),
    orderUnique: uniqueIndex("cancellation_requests_order_unique").on(table.shopifyOrderId),
  })
);

// --------------------------------------------------------------------------
// Unresolved refund problems from self-service cancellation.
//
// Shopify's orderCancel/refundCreate refund attempts resolve ASYNCHRONOUSLY
// and can fail (or hang indefinitely) after the mutation itself already
// reported success — confirmed against a real failure in production (order
// #1006: cancelled, restocked, but its refund transaction resolved to
// FAILURE ~2 seconds after the job reported done, with zero indication in
// the mutation's own response). A failure like this has NO webhook and
// leaves no other queryable trace, so this table is the only durable record
// that a customer's money is unresolved and needs a human to look at it —
// see lib/order-cancellation/issues.ts and execute-cancellation.ts.
//
// `resolvedAt` is written by nobody in this codebase yet — there is no
// admin UI for it. It exists so a human (via a direct database query, for
// now) can mark an issue handled once they've refunded the customer
// manually, without deleting the audit trail of what happened.
export const orderRefundIssueReasonEnum = pgEnum("order_refund_issue_reason", [
  "refund_failed",
  "refund_timeout",
  "cancel_failed_after_refund",
  "ambiguous_payment_state",
]);

export const orderRefundIssues = pgTable(
  "order_refund_issues",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    shopifyOrderId: text("shopifyOrderId").notNull(),
    orderName: text("orderName").notNull(),
    amountPaise: integer("amountPaise").notNull(),
    currencyCode: text("currencyCode").notNull(),
    reason: orderRefundIssueReasonEnum("reason").notNull(),
    // Raw error message/code from Shopify, for whoever investigates.
    detail: text("detail"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    resolvedAt: timestamp("resolvedAt", { mode: "date" }),
  },
  (table) => ({
    orderIdx: index("order_refund_issues_order_idx").on(table.shopifyOrderId),
    unresolvedIdx: index("order_refund_issues_unresolved_idx").on(table.resolvedAt),
  })
);
