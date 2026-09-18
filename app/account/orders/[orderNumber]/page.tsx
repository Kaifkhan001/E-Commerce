import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { lookupOrderStatus } from "@/lib/order-tracking/lookup-order";
import { OrderTrackingResult } from "@/components/order-tracking/order-tracking-result";

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
      <Link href="/account" className="mb-6 inline-block text-sm text-charcoal-soft hover:text-charcoal">
        ← Back to Account
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
    </>
  );
}
