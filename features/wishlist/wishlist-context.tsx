"use client";

// Dual-mode wishlist: anonymous visitors are stored in localStorage exactly
// as before (via useSyncExternalStore, so it behaves like a proper external
// store); signed-in users are backed by the database (lib/wishlist/db.ts),
// with optimistic updates here and a rollback on failure. Consumers
// (WishlistButton, WishlistView) call the same useWishlist() API regardless
// of which mode is active — this file is the only place that knows the
// difference.

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "bag_store_wishlist";
const CHANGE_EVENT = "bag_store_wishlist_change";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage unavailable (private browsing, quota) — fail silently.
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// useSyncExternalStore requires a stable snapshot reference between calls
// when nothing changed, so we cache the last parsed array keyed by the raw
// string rather than re-parsing (and returning a new array) every render.
let lastRaw: string | null = null;
let lastParsed: string[] = [];
function getSnapshot(): string[] {
  if (typeof window === "undefined") return lastParsed;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      lastParsed = raw ? JSON.parse(raw) : [];
    } catch {
      lastParsed = [];
    }
  }
  return lastParsed;
}

const EMPTY_IDS: string[] = [];
function getServerSnapshot(): string[] {
  return EMPTY_IDS;
}

async function postWishlistItem(method: "POST" | "DELETE", shopifyProductId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/wishlist", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopifyProductId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

type WishlistContextValue = {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  children,
  userId,
  initialIds,
}: {
  children: React.ReactNode;
  /** The signed-in user's database id, or null for an anonymous visitor — sourced server-side from auth(), see app/layout.tsx. */
  userId: string | null;
  /** Server-fetched wishlist for `userId`, so there's no loading flash on first paint — ignored when `userId` is null. */
  initialIds: string[];
}) {
  const localIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [accountIds, setAccountIds] = useState<string[]>(initialIds);

  // Merge-on-login: this can ONLY happen here, client-side, after a fresh
  // sign-in — a NextAuth callback runs server-side while processing the
  // OAuth/magic-link request and has no access to this browser's
  // localStorage at all. `mergedRef` (rather than relying solely on the
  // effect's dependency array) stops React Strict Mode's dev-only double
  // invoke from sending the merge request twice on the same mount; the
  // server's unique constraint would no-op a genuine duplicate anyway, but
  // there's no reason to make the network call twice.
  const mergedRef = useRef(false);

  useEffect(() => {
    if (!userId || mergedRef.current) return;
    mergedRef.current = true;

    const pending = readIds();
    if (pending.length === 0) return;

    let cancelled = false;
    fetch("/api/wishlist/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopifyProductIds: pending }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("merge request failed"))))
      .then((data: { ids: string[] }) => {
        if (cancelled) return;
        // Only clear the local copy once the merge is confirmed safe on
        // the server — never before.
        writeIds([]);
        setAccountIds(data.ids);
      })
      .catch(() => {
        // Leave localStorage untouched — the user must not lose items to a
        // failed network call. mergedRef staying true means this mount
        // won't retry; a later reload (fresh mount) will.
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = useCallback(
    (productId: string) => {
      if (!userId) {
        const current = readIds();
        const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
        writeIds(next);
        return;
      }

      const isRemoving = accountIds.includes(productId);
      setAccountIds((current) =>
        isRemoving ? current.filter((id) => id !== productId) : [...current, productId]
      );

      postWishlistItem(isRemoving ? "DELETE" : "POST", productId).then((ok) => {
        if (ok) return;
        // Roll back — the UI must never keep showing a state the server
        // didn't actually confirm.
        setAccountIds((current) =>
          isRemoving
            ? current.includes(productId)
              ? current
              : [...current, productId]
            : current.filter((id) => id !== productId)
        );
      });
    },
    [userId, accountIds]
  );

  const ids = userId ? accountIds : localIds;
  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  return <WishlistContext.Provider value={{ ids, toggle, has }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
