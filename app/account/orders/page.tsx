import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { AccountNav } from "@/components/account/account-nav";
import { OrderHistory } from "@/components/account/order-history";

export const metadata: Metadata = { title: "Orders" };

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="container-brand py-10 md:py-14">
      <h1 className="font-display mb-6 text-2xl md:text-3xl">Orders</h1>
      <AccountNav />
      {session.user?.email ? (
        <OrderHistory email={session.user.email} />
      ) : (
        <p className="text-sm text-charcoal-soft">We don&rsquo;t have an email on file for this account.</p>
      )}
    </div>
  );
}
