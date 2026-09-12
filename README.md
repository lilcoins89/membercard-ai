# MemberCard AI

**Membership cards, created by AI.**

AI-powered digital and physical membership card platform for clubs, gyms, associations, fan clubs, and membership businesses.

Tell AI what you need → provide the information → cards are created automatically.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI |
| Backend | Next.js Route Handlers |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Groq (`llama-3.3-70b-versatile`) with tool/function calling |
| Payments | Stripe Checkout + webhooks |
| Fulfillment | Provider-agnostic PVC layer (`mock` + `custom` adapters) |

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill Supabase, Groq, and Stripe keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without env keys the app runs in **demo mode**: landing, AI chat (guided replies), dashboard, members, cards, orders, and public verify (`/verify/demo-sarah-active`).

## Database

Apply `supabase/schema.sql` in the Supabase SQL editor.

## Deploy

1. Import this repo on Vercel
2. Set env vars from `.env.example`
3. Run schema SQL on Supabase
4. Point Stripe + fulfillment webhooks at your domain
