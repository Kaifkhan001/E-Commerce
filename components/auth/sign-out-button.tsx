"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="border border-charcoal px-5 py-2.5 text-sm hover:bg-charcoal hover:text-ivory"
    >
      Sign Out
    </button>
  );
}
