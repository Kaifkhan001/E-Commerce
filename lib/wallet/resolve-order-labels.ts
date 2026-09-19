import "server-only";
import { adminApiConfigured, shopifyAdminFetch } from "@/lib/shopify/admin-client";

// Resolves Shopify order GIDs (as stored verbatim in
// wallet_transactions.shopifyOrderId) to their customer-facing order number
// (e.g. "#1006"), for DISPLAY ONLY. This never reads or writes the ledger —
// see components/account/wallet-section.tsx for how it's used to keep the
// raw gid://shopify/Order/... string out of the customer-facing UI while
// leaving the ledger's own `note` column (an audit record) untouched.
const NODES_QUERY = `
  query WalletOrderLabels($ids: [ID!]!) {
    nodes(ids: $ids) {
      id
      ... on Order {
        name
      }
    }
  }
`;

type NodesResponse = {
  nodes: ({ id: string; name?: string } | null)[];
};

/**
 * Batch-resolves order GIDs to order names in a single Admin API call
 * (rather than one call per ledger row). A GID that fails to resolve — API
 * unavailable, or the order no longer exists — is simply absent from the
 * returned map; callers must fall back to a generic (non-leaking) label in
 * that case rather than showing the raw GID.
 */
export async function resolveOrderLabels(shopifyOrderIds: (string | null)[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(shopifyOrderIds.filter((id): id is string => Boolean(id)))];
  const labels = new Map<string, string>();

  if (uniqueIds.length === 0 || !adminApiConfigured) {
    return labels;
  }

  try {
    const data = await shopifyAdminFetch<NodesResponse>(NODES_QUERY, { ids: uniqueIds });
    for (const node of data.nodes) {
      if (node?.name) {
        labels.set(node.id, node.name);
      }
    }
  } catch {
    // Best-effort — resolution failing should degrade every row to a
    // generic label, not break the wallet page.
  }

  return labels;
}

/** "#1006" -> "1006", for building an /account/orders/[orderNumber] link. */
export function orderNumberFromName(name: string): string {
  return name.replace(/^#/, "");
}
