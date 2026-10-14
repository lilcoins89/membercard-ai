# MemberCard AI

**Create your membership card with AI.**

Tell us a little about your card — organization name, member name, photo, membership type — and we generate a premium digital card automatically. Optionally order a physical PVC card.

## Experience

1. **Home** — Start Creating
2. **AI conversation** — asks only what’s needed
3. **Card ready** — preview, save, share, or order physical
4. **Physical order** — delivery address → shipping quote → payment (Stripe card or Solana USDC) → fulfillment

Payments are Stripe (card) or Solana USDC. Shipping is a domestic rate plus an international surcharge. Shipment state lives in Neon, and an authenticated Stripe webhook triggers fulfillment once a card payment is confirmed. The mock provider is available only when `FULFILLMENT_PROVIDER=mock` and `FULFILLMENT_TEST_MODE=true`; production requires a real provider adapter.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Groq AI (`llama-3.3-70b-versatile`) with tool calling
- Stripe Checkout (card) and Solana USDC payments
- Neon Postgres via drizzle-orm and `pg`
- Custom PVC fulfillment provider (`FULFILLMENT_API_URL` + `FULFILLMENT_API_KEY`)

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Without `GROQ_API_KEY`, the create flow still walks the same questions and generates a card so you can test the UI.

## Environment variables

- `DATABASE_URL` — Neon connection string. `POSTGRES_URL`, `PRISMA_DATABASE_URL` and `PRISMA_DATABASE_URL_2` are still accepted as fallbacks, in that order, for compatibility.
- `STRIPE_SECRET_KEY` — server-side Stripe key for creating Checkout sessions
- `STRIPE_WEBHOOK_SECRET` — verifies Stripe webhook signatures at `/api/stripe/webhook`
- `NEXT_PUBLIC_APP_URL` — public base URL used for Stripe success and cancel redirects
- `FULFILLMENT_PROVIDER` — `custom` (required for production) or `mock`
- `FULFILLMENT_API_URL` and `FULFILLMENT_API_KEY` — server-only provider credentials
- `FULFILLMENT_TEST_MODE` — set to `true` together with `FULFILLMENT_PROVIDER=mock` for explicit, non-production test mode
- `HELIUS_API` or `HELIUS_RPC` — Helius access for verifying Solana payments; at least one is required
- `GROQ_API_KEY` — Groq API key for AI card generation. The create flow currently falls back to a built-in question flow and does not require it.

Shipping is priced from the Neon `shipping_config` table: a domestic base rate plus a configurable international surcharge. A real provider account/API is still required before orders can be submitted to a fulfillment partner.

## Database

Schema changes go in `sql/schema.sql` and are applied with `pnpm db:push`, which runs `psql "$DATABASE_URL" -f sql/schema.sql`. The file is idempotent (`create ... if not exists`, `add column if not exists`), so it is safe to run against an existing database.

## CI

CI runs on pushes and pull requests to `main`. The intended steps are:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
```

## Deploy (Vercel)

1. Import this repo
2. Set env vars from `.env.example`
3. Configure the Stripe webhook route at `/api/stripe/webhook`
4. Deploy
