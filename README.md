# MemberCard AI

**Create your membership card with AI.**

Tell us a little about your card — organization name, member name, photo, membership type — and we generate a premium digital card automatically. Optionally order a physical PVC card shipped in the U.S.

## Experience

1. **Home** — Start Creating
2. **AI conversation** — asks only what’s needed
3. **Card ready** — preview, save, share, or order physical
4. **Physical order** — U.S. address → live shipping rates → Stripe checkout → fulfillment

No admin dashboard. No mock members. Just card generation.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Groq AI (`llama-3.3-70b-versatile`) with tool calling
- Stripe Checkout
- Custom PVC fulfillment provider (`FULFILLMENT_API_URL` + `FULFILLMENT_API_KEY`)

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without `GROQ_API_KEY`, the create flow still walks the same questions and generates a card so you can test the UI.

## Deploy (Vercel)

1. Import this repo
2. Set env vars from `.env.example`
3. Deploy
