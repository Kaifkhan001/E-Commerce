CREATE TYPE "public"."order_refund_issue_reason" AS ENUM('refund_failed', 'refund_timeout', 'cancel_failed_after_refund', 'ambiguous_payment_state');--> statement-breakpoint
CREATE TABLE "order_refund_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"shopifyOrderId" text NOT NULL,
	"orderName" text NOT NULL,
	"amountPaise" integer NOT NULL,
	"currencyCode" text NOT NULL,
	"reason" "order_refund_issue_reason" NOT NULL,
	"detail" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE INDEX "order_refund_issues_order_idx" ON "order_refund_issues" USING btree ("shopifyOrderId");--> statement-breakpoint
CREATE INDEX "order_refund_issues_unresolved_idx" ON "order_refund_issues" USING btree ("resolvedAt");