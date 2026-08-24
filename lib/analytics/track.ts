"use client";

// Thin analytics wrapper around GA4 (gtag.js) and Meta Pixel. Both scripts
// are only injected (see analytics-scripts.tsx) when their env var is set,
// and every tracking call here is a safe no-op if the underlying global
// isn't present — so the app never throws when analytics isn't configured.

type EventName =
  | "page_view"
  | "view_item"
  | "view_collection"
  | "search"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase"
  | "login"
  | "sign_up"
  | "wishlist_add";

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: EventName, params: EventParams = {}) {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", name, params);
  }

  if (window.fbq) {
    // Meta Pixel uses its own standard event vocabulary — map the handful
    // of events with direct equivalents; everything else goes through as a
    // custom event so nothing is silently dropped.
    const metaEventMap: Partial<Record<EventName, string>> = {
      view_item: "ViewContent",
      add_to_cart: "AddToCart",
      begin_checkout: "InitiateCheckout",
      purchase: "Purchase",
      search: "Search",
    };
    const metaEvent = metaEventMap[name];
    if (metaEvent) {
      window.fbq("track", metaEvent, params);
    } else {
      window.fbq("trackCustom", name, params);
    }
  }
}
