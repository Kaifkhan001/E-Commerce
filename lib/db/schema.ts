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

// Schema only for now — no UI or query logic wired against this yet.
// Will back a server-synced wishlist (replacing/augmenting the current
// localStorage-only implementation in features/wishlist/wishlist-context.tsx)
// in a later step.
export const wishlistItems = pgTable("wishlist_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shopifyProductId: text("shopifyProductId").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

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
    // order context) has somewhere to live without a fake order id —
    // Postgres treats each NULL as distinct, so nulls never collide with
    // the unique constraint below.
    shopifyOrderId: text("shopifyOrderId"),
    // Set for 'earned' rows only — when that credit stops being spendable.
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    // Human-readable explanation for auditing (e.g. "5% cashback on order
    // #1234" or "reversed: order #1234 cancelled").
    note: text("note"),
  },
  (table) => ({
    emailIdx: index("wallet_transactions_email_idx").on(table.email),
    // Primary idempotency guard: a webhook retry or duplicate delivery for
    // the same order can never insert a second row of the same type. See
    // lib/wallet/ledger.ts for how this is used (and its current
    // limitation for multiple partial refunds on one order).
    orderTypeUnique: uniqueIndex("wallet_transactions_order_type_unique").on(table.shopifyOrderId, table.type),
  })
);
