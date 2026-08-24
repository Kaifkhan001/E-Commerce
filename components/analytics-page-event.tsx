"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

type Props =
  | { event: "view_item"; params: { item_id: string; item_name: string; price: string } }
  | { event: "view_collection"; params: { collection_handle: string } }
  | { event: "search"; params: { search_term: string; results_count: number } };

// Server Components (product/collection/search pages) can't call trackEvent
// directly since it touches window.gtag/fbq. Render this tiny client
// component inside them instead — it fires once on mount and renders nothing.
export function AnalyticsPageEvent({ event, params }: Props) {
  useEffect(() => {
    trackEvent(event, params);
    // Only fire once per mount — params are derived from page data that
    // doesn't change without a full navigation (new mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
