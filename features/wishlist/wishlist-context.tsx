"use client";

// Client-side wishlist, persisted to localStorage so it survives reloads on
// the same browser for both signed-in and anonymous visitors. This is NOT
// synced to a server, so it will not follow a user across devices — that
// requires a database-backed store keyed to the authenticated user (see
// README "Wishlist" section for how to extend this once you have one).
//
// Implemented with useSyncExternalStore (rather than useState+useEffect) so
// localStorage acts as a proper external store — this avoids the
// "setState-in-effect" anti-pattern for what is genuinely external state.

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

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

type WishlistContextValue = {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((productId: string) => {
    const current = readIds();
    const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
    writeIds(next);
  }, []);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  return <WishlistContext.Provider value={{ ids, toggle, has }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
