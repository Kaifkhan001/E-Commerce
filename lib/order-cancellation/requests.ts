import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cancellationRequests } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/wallet/money";

const POSTGRES_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; cause?: { code?: unknown } };
  return err.code === POSTGRES_UNIQUE_VIOLATION || err.cause?.code === POSTGRES_UNIQUE_VIOLATION;
}

export async function getExistingCancellationRequest(shopifyOrderId: string): Promise<{ createdAt: Date } | null> {
  const [row] = await db
    .select({ createdAt: cancellationRequests.createdAt })
    .from(cancellationRequests)
    .where(eq(cancellationRequests.shopifyOrderId, shopifyOrderId))
    .limit(1);
  return row ?? null;
}

export type RecordRequestResult = { inserted: true } | { inserted: false; reason: "duplicate" };

/**
 * Records a cancellation request. Idempotent per order — a repeated
 * request (double click, page reload + resubmit) hits the unique index on
 * `shopifyOrderId` and comes back as `{ inserted: false, reason:
 * "duplicate" }` rather than throwing, which the caller treats as success
 * (the request is on file) without sending the store owner a second email.
 */
export async function recordCancellationRequest(params: {
  email: string;
  shopifyOrderId: string;
  orderName: string;
  reason: string;
}): Promise<RecordRequestResult> {
  try {
    await db.insert(cancellationRequests).values({
      email: normalizeEmail(params.email),
      shopifyOrderId: params.shopifyOrderId,
      orderName: params.orderName,
      reason: params.reason,
    });
    return { inserted: true };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { inserted: false, reason: "duplicate" };
    }
    throw error;
  }
}
