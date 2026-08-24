import "server-only";

// Server-only Shopify Admin API client using the Client Credentials Grant
// (client_id + client_secret exchanged for a short-lived access token).
// This grant only works for development stores / custom apps installed on
// a development store — see the error thrown in fetchAccessToken below.
// Never import this from a Client Component; it holds a client secret and
// a live access token in memory.

const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-04";

export const adminApiConfigured = Boolean(storeDomain && clientId && clientSecret);

type CachedToken = { accessToken: string; expiresAt: number };

let cachedToken: CachedToken | null = null;

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

function tokenNeedsRefresh(token: CachedToken | null): boolean {
  if (!token) return true;
  return Date.now() >= token.expiresAt - REFRESH_MARGIN_MS;
}

async function fetchAccessToken(): Promise<CachedToken> {
  if (!storeDomain || !clientId || !clientSecret) {
    throw new Error(
      "Shopify Admin API is not configured. Set SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_CLIENT_ID, and " +
        "SHOPIFY_ADMIN_CLIENT_SECRET."
    );
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  let response: Response;
  try {
    response = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(
      `Network error requesting a Shopify Admin API access token: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  const text = await response.text();
  let data: { access_token?: string; expires_in?: number; error?: string; error_description?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // fall through — response.ok check below will surface a useful error
  }

  if (!response.ok || !data.access_token) {
    const reason = data.error || data.error_description || text || `${response.status} ${response.statusText}`;
    const hint =
      data.error === "shop_not_permitted" || /shop_not_permitted/i.test(text)
        ? " A \"shop_not_permitted\" response means this store isn't a development store — the Client " +
          "Credentials Grant only works on development stores. Use the Authorization Code Grant flow instead."
        : "";
    throw new Error(`Failed to obtain a Shopify Admin API access token: ${reason}.${hint}`);
  }

  const expiresInMs = (data.expires_in ?? 0) * 1000;
  return { accessToken: data.access_token, expiresAt: Date.now() + expiresInMs };
}

async function getAccessToken(): Promise<string> {
  if (tokenNeedsRefresh(cachedToken)) {
    cachedToken = await fetchAccessToken();
  }
  const token = cachedToken;
  if (!token) {
    throw new Error("Failed to obtain a Shopify Admin API access token.");
  }
  return token.accessToken;
}

export class ShopifyAdminApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly graphqlErrors?: unknown
  ) {
    super(message);
    this.name = "ShopifyAdminApiError";
  }
}

export async function shopifyAdminFetch<TData>(query: string, variables?: object): Promise<TData> {
  if (!storeDomain) {
    throw new ShopifyAdminApiError("Shopify Admin API is not configured: SHOPIFY_STORE_DOMAIN is missing.");
  }

  const accessToken = await getAccessToken();

  let response: Response;
  try {
    response = await fetch(`https://${storeDomain}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch (err) {
    throw new ShopifyAdminApiError(
      `Network error contacting Shopify Admin API: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!response.ok) {
    throw new ShopifyAdminApiError(
      `Shopify Admin API returned ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const json = await response.json();

  if (json.errors && (Array.isArray(json.errors) ? json.errors.length > 0 : true)) {
    throw new ShopifyAdminApiError("Shopify Admin API returned GraphQL errors", response.status, json.errors);
  }

  return json.data as TData;
}
