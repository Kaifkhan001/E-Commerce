CREATE TABLE "cancellation_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"shopifyOrderId" text NOT NULL,
	"orderName" text NOT NULL,
	"reason" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cancellation_requests_email_idx" ON "cancellation_requests" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "cancellation_requests_order_unique" ON "cancellation_requests" USING btree ("shopifyOrderId");