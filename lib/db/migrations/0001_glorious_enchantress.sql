CREATE TYPE "public"."wallet_transaction_type" AS ENUM('earned', 'redeemed', 'expired', 'reversed');--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"amountPaise" integer NOT NULL,
	"type" "wallet_transaction_type" NOT NULL,
	"shopifyOrderId" text,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE INDEX "wallet_transactions_email_idx" ON "wallet_transactions" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_transactions_order_type_unique" ON "wallet_transactions" USING btree ("shopifyOrderId","type");