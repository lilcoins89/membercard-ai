import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { shippingSchema, quoteShipping } from "@/lib/shipping";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const parsed = shippingSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Check your delivery details." }, { status: 400 });
  const input = parsed.data;
  const rows = await db.execute(sql`SELECT base_fee_cents, card_fee_cents, international_surcharge_cents FROM public.shipping_config WHERE id = 1`);
  const config = rows.rows[0] as { base_fee_cents?: number; card_fee_cents?: number; international_surcharge_cents?: number } | undefined;
  const quote = quoteShipping(input.country, config);
  const demoUserId = "demo-user";
  const idempotencyKey = crypto.createHash("sha256").update(`${demoUserId}:${input.card_id}:${input.email}:${input.street}:${input.zip}`).digest("hex");
  const result = await db.execute(sql`INSERT INTO public.shipment_orders (user_id, card_id, card_snapshot, recipient_name, email, phone, street, unit, city, state, postal_code, country, shipping_cost_cents, total_cents, idempotency_key) VALUES (${demoUserId}, ${input.card_id}, ${JSON.stringify(input.card_snapshot)}::jsonb, ${input.full_name}, ${input.email}, ${input.phone ?? null}, ${input.street}, ${input.unit ?? null}, ${input.city}, ${input.state ?? null}, ${input.zip}, ${input.country.toUpperCase()}, ${quote.shipping_cost_cents}, ${quote.shipping_cost_cents}, ${idempotencyKey}) ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = now() RETURNING id, total_cents, shipping_cost_cents`);
  return NextResponse.json({ ok: true, shipment: result.rows[0], estimated_days: quote.estimated_days });
}
