DROP INDEX "wallet_transactions_order_type_unique";--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN "sourceEventId" text;--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_transactions_order_type_event_unique" ON "wallet_transactions" USING btree ("shopifyOrderId","type","sourceEventId");