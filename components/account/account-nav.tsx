"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wallet", label: "Wallet" },
  { href: "/account/wishlist", label: "Wishlist" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-6 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const isActive = tab.href === "/account" ? pathname === "/account" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap border-b-2 pb-3 text-sm transition-colors",
              isActive ? "border-charcoal text-charcoal" : "border-transparent text-charcoal-soft hover:text-charcoal"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
