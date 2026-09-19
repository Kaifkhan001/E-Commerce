import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { lookupOrderStatus } from "@/lib/order-tracking/lookup-order";
import { OrderTrackingResult } from "@/components/order-tracking/order-tracking-result";
import { fetchOrderForCancellation } from "@/lib/order-cancellation/fetch-order";
import { checkCancellationEligibility } from "@/lib/order-cancellation/eligibility";
import { getExistingCancellationRequest } from "@/lib/order-cancellation/requests";
import { OrderCancellation, type OrderCancellationState } from "@/components/account/order-cancellation";

export const metadata: Metadata = { title: "Order" };

// Authenticated per-order tracking view. The email used to look up the
// order comes ONLY from the server-side session — never from the URL or
// any client-supplied value — so a signed-in customer can never see
// another customer's order just by guessing/editing the order number in
// the URL. This intentionally does not touch /track-order's own
// (unauthenticated, order-number + email) security model at all.
export default async function AccountOrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const { orderNumber } = await params;
  const email = session.user?.email;

  return (
    <div className="container-brand py-10 md:py-14">
      <Link href="/account/orders" className="mb-6 inline-block text-sm text-charcoal-soft hover:text-charcoal">
        ← Back to Orders
      </Link>

      {!email ? (
        <p className="text-sm text-charcoal-soft">We don&rsquo;t have an email on file for this account.</p>
      ) : (
        <OrderLookup orderNumber={orderNumber} email={email} />
      )}
    </div>
  );
}

async function OrderLookup({ orderNumber, email }: { orderNumber: string; email: string }) {
  const result = await lookupOrderStatus(orderNumber, email);

  if (!result.found) {
    return (
      <p className="text-sm text-sale">
        We couldn&apos;t find that order on your account. Check your order history and try again.
      </p>
    );
  }

  return (
    <>
      <OrderTrackingResult
        data={{
          order: result.order,
          tracking: {
            stage: result.tracking.stage,
            isConfirmed: result.tracking.isConfirmed,
            estimatedDeliveryByDate: result.tracking.estimatedDeliveryByDate.toISOString(),
          },
          stageDates: result.stageDates,
        }}
      />
      <p className="mt-8 text-xs leading-relaxed text-charcoal-soft">
        Placed, Shipped, and Out for Delivery are estimated based on typical delivery timelines for your area —
        not live courier tracking. Delivered is confirmed manually by our team once your order actually arrives.
      </p>

      <div className="mt-8">
        <CancellationPanel orderNumber={orderNumber} email={email} />
      </div>
    </>
  );
}

// Its own fetch (separate from lookupOrderStatus above) since cancellation
// needs fields — cancelledAt, transactions, fulfillment status re-verified
// fresh — that the read-only tracking view has no reason to ask for. See
// lib/order-cancellation/fetch-order.ts.
async function CancellationPanel({ orderNumber, email }: { orderNumber: string; email: string }) {
  const result = await fetchOrderForCancellation(orderNumber, email);
  if (!result.found) {
    // Fails closed: if this can't be confirmed for any reason, simply don't
    // offer cancellation rather than guessing at eligibility.
    return null;
  }

  const { order } = result;
  const eligibility = checkCancellationEligibility(order);
  const existingRequest = eligibility.action === "request" ? await getExistingCancellationRequest(order.id) : null;

  const state: OrderCancellationState = {
    eligibility: eligibility.action === "blocked" ? "already_cancelled" : eligibility.action,
    cancelledAt: order.cancelledAt,
    existingRequestAt: existingRequest?.createdAt.toISOString() ?? null,
  };

  return <OrderCancellation orderNumber={orderNumber} state={state} />;
}
