# Aramis Bags — Headless Shopify Storefront

A Next.js storefront for a bag manufacturing brand, backed by Shopify as the commerce engine via the Storefront API. Runs in a **mock data mode** out of the box (no Shopify account needed to develop against), and switches to **live Shopify mode** with three environment variables.

> "Aramis Bags" is a placeholder brand name and all copy, imagery, and business details (address, phone, policies) in this repo are demo content. Search for "placeholder" throughout the codebase before launch — every instance is intentionally flagged.

## Architecture

```
Customer → Next.js (Server Components + Server Actions) → Shopify Storefront API (GraphQL) → Shopify (catalog, cart, checkout, orders)
```

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Commerce backend:** Shopify Storefront API (GraphQL), API version 2026-04
- **Auth:** NextAuth v5 (Google, Facebook, Email-with-database)
- **Cart:** Shopify's Cart API is the source of truth — this app never maintains a shadow cart database. In mock mode, an in-memory mock replicates the same shape so the rest of the app doesn't need to know which mode it's in.
- **Checkout & payments:** Shopify's own hosted checkout (`cart.checkoutUrl`) — see "Razorpay configuration" below for why this app does not implement a custom payment flow.

```
app/
  (shop)/            shop, collections, products, search, cart routes
  account/, auth/     account + NextAuth login
  api/                NextAuth handler, wishlist lookup, bag finder
  about/, contact/, faq/, shipping/, returns/, privacy/, terms/
components/
  layout/  home/  product/  collection/  cart/  search/  auth/  ui/
features/
  bag-finder/   wishlist/
lib/
  shopify/   auth/   analytics/   utils/
types/                shared domain types (Product, Cart, etc.)
config/site.ts         nav links, footer content, demo business info
```

## Local development

```bash
npm install
cp .env.example .env.local     # defaults to mock mode — no edits required to start
npm run dev
```

Open http://localhost:3000. The full shop to product to cart flow works immediately in mock mode.

## Mock mode vs real Shopify mode

Controlled by `SHOPIFY_ENABLED` in `.env.local`:

- `SHOPIFY_ENABLED=false` (default): serves 6 demo bag products from `lib/shopify/mock-data.ts`, with an in-memory mock cart. Nothing leaves your machine.
- `SHOPIFY_ENABLED=true`: requires `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (see below) — the app throws a clear startup error if either is missing.

Every component reads from `types/shopify.ts` domain types, not Shopify's raw GraphQL shapes — `lib/shopify/*.ts` normalizes both mock and live data into the same shape, so there is exactly one UI implementation, not two.

## Shopify setup

1. In Shopify Admin: **Settings > Apps and sales channels > Develop apps > Create an app**.
2. Under **API credentials**, configure Storefront API scopes (read products, read collections, unauthenticated checkout/cart) and install the app to generate a **Storefront API access token**.
3. Set in `.env.local`:
   ```
   SHOPIFY_ENABLED=true
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_...
   ```
4. Restart the dev server.

### Bag specifications (metafields)

Product specs (capacity, material, weight, laptop compatibility, etc.) are read from Shopify metafields in the `bag` namespace — see `lib/shopify/queries.ts` for the exact keys expected (e.g. `bag.capacity_liters`, `bag.material`). Set these up in **Shopify Admin > Settings > Custom data > Products** before they'll appear on product pages. Until then, the Specifications section on a product page simply doesn't render for that field — nothing is invented.

## Auth provider setup

Auth is powered by NextAuth v5 (`lib/auth/auth.ts`). Each provider is registered **only if its env vars are fully present** — an unconfigured provider's button simply doesn't appear, rather than appearing and failing.

### Google OAuth
1. Google Cloud Console > APIs & Services > Credentials > Create OAuth client ID (Web application).
2. Authorized redirect URI: `{NEXT_PUBLIC_SITE_URL}/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### Facebook OAuth
1. Meta for Developers > Create App > add "Facebook Login" product.
2. Valid OAuth redirect URI: `{NEXT_PUBLIC_SITE_URL}/api/auth/callback/facebook`
3. Set `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`.

### Email provider setup
Email (magic link) sign-in needs **two** things, not one:
1. SMTP credentials (`EMAIL_SERVER_HOST/PORT/USER/PASSWORD`, `EMAIL_FROM`) — any transactional email provider (Resend, Postmark, SES, etc.) that exposes SMTP works.
2. A **database adapter** — NextAuth stores email verification tokens in a database; it cannot do this as pure JWT. This is an infrastructure decision (which database, which adapter package) this build deliberately leaves to you rather than picking silently. Once you've chosen a database:
   - `npm install @auth/DATABASE-adapter` (e.g. `@auth/prisma-adapter`, `@auth/drizzle-adapter`)
   - Wire it into `lib/auth/auth.ts` as the `adapter` option
   - Set `AUTH_DATABASE_URL`

   Until `AUTH_DATABASE_URL` is set, the Email option is hidden on the login page rather than appearing and silently failing.

`NEXTAUTH_SECRET` is required for any provider to work: generate with `npx auth secret`.

## Razorpay configuration

**This codebase does not implement a custom Razorpay checkout, and `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are not read anywhere in the code.** This is deliberate, not an oversight.

This storefront hands off to Shopify's own hosted checkout (`cart.checkoutUrl`), which is the Shopify-recommended pattern for headless storefronts — checkout, payment capture, fraud protection, and order creation all stay inside Shopify's system as one unit. A separate custom Razorpay integration outside that checkout would require maintaining your own reconciliation between "Razorpay says paid" and "Shopify says paid" — exactly the desync risk this project's brief called out as unacceptable — and would also require checkout infrastructure this app doesn't currently have (Shopify Plus + Checkout Extensibility, at minimum).

The straightforward, safe path — confirmed against Razorpay's current Shopify integration — is:
1. Get a Razorpay account and complete KYC (business PAN, bank details).
2. In Shopify Admin: **Settings > Payments > Add a provider** > search for and install **"All-in-one Razorpay Payment Gateway"** from the Shopify App Store.
3. Connect your Razorpay credentials inside that app (not in this codebase).
4. Razorpay (UPI, cards, netbanking, wallets) then appears automatically as a payment option on Shopify's hosted checkout — no code changes here.

If a future requirement genuinely needs a fully custom checkout outside Shopify's hosted flow, treat that as its own project phase with its own reconciliation design — don't bolt it onto this codebase silently.

## Testing

```bash
npm run lint         # ESLint
npx tsc --noEmit      # TypeScript
npm run build         # production build
npm start              # serve the production build locally
```

All four pass clean as of this handoff, in mock mode. Live-Shopify-mode and live-OAuth-provider behavior could not be verified in this environment (no real store/OAuth credentials were available) — test those against your own credentials before considering them production-verified.

### What was browser/functionally verified in this environment
Homepage, navbar (incl. mobile drawer), shop listing + sort, collection pages, product detail (gallery, variant selection, specs), search, add-to-cart to drawer to cart page to mock checkout URL, wishlist add/remove, Bag Finder quiz, all static/policy pages, 404 page, loading skeletons — all against mock data.

### What is code-complete but NOT independently verified here
- Live Shopify product/collection/cart data (needs a real store + token)
- Google/Facebook OAuth login (needs registered OAuth apps)
- Email magic-link login (needs SMTP + a database adapter)
- Razorpay-in-Shopify-checkout (needs a Shopify Admin + Razorpay account)
- Production deployment on Vercel (not deployed — no deployment credentials provided)

## Production build & deployment (Vercel)

```bash
npm run build
```

To deploy: connect this repo to Vercel, set the environment variables from `.env.example` in the Vercel project settings, and set `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` to your real domain. No `next.config.ts` changes are needed for Vercel specifically.

## Product photography

Real product images are not yet in this build — `/public/images/README.md` explains exactly where to drop your 7 real photos and how to wire them into `lib/shopify/mock-data.ts`. Until then, every product/lifestyle image uses real, freely-licensed Unsplash photography (not random placeholder images) as interim imagery — search the codebase for `images.unsplash.com` to find every instance that should eventually be swapped for real photos. `next/image` already serves modern formats (WebP/AVIF) and responsive sizes automatically for both local and remote images — no manual image conversion is needed; `sharp` is installed to power this in production/self-hosted deployments.

## Delivery partner setup

A **pincode serviceability checker** ("Check delivery to your pincode") appears on every product page, backed by Shiprocket's serviceability API. This is the one part of courier integration that genuinely belongs in the storefront frontend — everything else (AWB generation, pickup scheduling, tracking, COD remittance) happens on **orders**, which only exist after Shopify checkout completes, so that work belongs in a Shopify Admin app (Shiprocket, Delhivery, etc.), not this codebase.

To enable the checker:
1. Create a Shiprocket account and note your account email/password.
2. Set in `.env.local`:
   ```
   SHIPPING_PROVIDER=shiprocket
   SHIPROCKET_EMAIL=you@example.com
   SHIPROCKET_PASSWORD=...
   SHIPROCKET_PICKUP_PINCODE=400001
   ```
3. For actual order fulfillment, separately install Shiprocket (or Delhivery) from the Shopify App Store and connect it there — that's independent of these credentials.

Delhivery is a valid alternative for the serviceability checker but isn't implemented in `lib/shipping/` yet — its auth model (API key header) differs enough from Shiprocket's (login → token) that it deserves its own verified implementation rather than a guess. See `lib/shipping/index.ts` for where to add it.

## Adding products / product images

- **Mock mode:** edit `lib/shopify/mock-data.ts` — each product is a plain object; images currently point at real (freely-licensed) Unsplash URLs used as interim photography — see "Product photography" above for swapping in your real photos.
- **Live mode:** add/edit products in Shopify Admin as normal — they appear automatically via the Storefront API. Add bag-spec metafields (see "Bag specifications" above) to populate the Specifications section.
- Real product images belong in Shopify (for live mode) or `/public/images` (for local/static imagery). `next.config.ts` already allow-lists `cdn.shopify.com` and `images.unsplash.com`.

## Troubleshooting

- **"SHOPIFY_ENABLED=true but SHOPIFY_STORE_DOMAIN or ... is missing"** — set both vars or switch back to `SHOPIFY_ENABLED=false`.
- **Login buttons don't appear** — that provider's env vars aren't fully set; see "Auth provider setup" above.
- **Images 400/403 in production** — add the image's domain to `remotePatterns` in `next.config.ts`.
- **Cart empty after redeploy** — the cart ID is stored in an httpOnly cookie tied to a specific Shopify cart; expected if cookies were cleared or a Shopify cart expired (~10 days of inactivity).

## Known gaps / next steps

- **Real product photos not yet included** — waiting on the 7 real product images; interim Unsplash photography is in place everywhere (see "Product photography").
- Newsletter and contact forms are UI-only (no email service wired up) — see `TODO` comments in `components/home/newsletter-form.tsx` and `app/contact/page.tsx`.
- Wishlist is per-browser (localStorage), not synced across devices for signed-in users — see comments in `features/wishlist/wishlist-context.tsx`.
- Order history on `/account` is a placeholder pending Shopify Customer Account API integration.
- Delhivery is documented as a delivery-checker alternative but not implemented — see "Delivery partner setup".
- `nodemailer` is pinned to the exact version `9.0.5` (via both a direct dependency and a matching `overrides` entry in `package.json`) to close a high-severity CVE affecting `<=9.0.0`, since that version sits slightly outside next-auth's declared peer range (`^7.0.7 || ^8.0.5`). The `overrides` entry is required for `npm install` to succeed cleanly from a fresh clone — verified with a from-scratch `rm -rf node_modules package-lock.json && npm install`. Re-check this pin on next-auth upgrades.
- next-auth is on a `5.0.0-beta` release (no stable v5 yet) — expect API changes on major version bumps.
