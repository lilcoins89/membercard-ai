# MemberCard AI

**Create your membership card with AI.**

Tell us a little about your card — organization name, member name, photo, membership type — and we generate a premium digital card automatically. Optionally order a physical PVC card shipped domestically or internationally.

## Experience

1. **Home** — Start Creating
2. **AI conversation** — asks only what’s needed
3. **Card ready** — preview, save, share, or order physical
4. **Physical order** — shipping address → configured shipping rate → Stripe or Solana (SOL) payment → fulfillment

Card delivery now uses Neon for shipment state and an authenticated Stripe webhook for payment-confirmed fulfillment. The mock provider is available only when `FULFILLMENT_PROVIDER=mock` and `FULFILLMENT_TEST_MODE=true`; production requires a real provider adapter.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Groq AI (`llama-3.3-70b-versatile`) with tool calling
- Stripe Checkout and Solana (SOL) payments; the Solana treasury address is configured in `src/lib/solana.ts`
- Custom PVC fulfillment provider (`FULFILLMENT_API_URL` + `FULFILLMENT_API_KEY`)

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without `GROQ_API_KEY`, the create flow still walks the same questions and generates a card so you can test the UI.

## Shipping environment

- `DATABASE_URL` — Neon connection string
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — server-side Stripe payment and webhook verification
- `FULFILLMENT_PROVIDER=custom` — required for production fulfillment
- `FULFILLMENT_API_URL` and `FULFILLMENT_API_KEY` — server-only provider credentials
- `FULFILLMENT_PROVIDER=mock` plus `FULFILLMENT_TEST_MODE=true` — explicit test-only mode
- `ADMIN_EMAILS` — comma-separated server-side admin email allowlist

Shipping is priced from the Neon `shipping_config` table; the default is $6.99 domestic and an international surcharge is configurable. A real provider account/API is still required before orders can be submitted to a fulfillment partner.

## Database

Run `pnpm db:push` against a fresh Neon database to apply `sql/schema.sql`. The script runs `psql "$PRISMA_DATABASE_URL_2" -f sql/schema.sql`, and the schema file is safe to re-run.

The application connects using the first of these environment variables that is set, checked in this order by `src/lib/db.ts`: `PRISMA_DATABASE_URL_2`, `PRISMA_DATABASE_URL`, `POSTGRES_URL`, `DATABASE_URL`.

## CI

CI runs `pnpm install --frozen-lockfile`, `pnpm lint`, and `pnpm build` on push and pull requests to `main`.

## Deploy (Vercel)

1. Import this repo
2. Set env vars from `.env.example`
3. Configure the Stripe webhook route at `/api/stripe/webhook`
4. Deploy
