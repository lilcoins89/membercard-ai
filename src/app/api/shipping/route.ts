import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { shippingOrders } from "@/lib/db/schema";
import { addEvent, getScopedUserId, listShipments } from "@/lib/shipping";

const schema = z.object({ card_id: z.string().min(1), card_snapshot: z.record(z.unknown()), recipient_name: z.string().min(2), email: z.string().email(), phone: z.string().optional(), street: z.string().min(3), unit: z.string().optional(), city: z.string().min(2), state: z.string().length(2), zip: z.string().regex(/^\d{5}(-\d{4})?$/), country: z.literal("US"), shipping_service: z.string().min(1), shipping_cost_cents: z.number().int().nonnegative(), card_cost_cents: z.number().int().positive(), fulfillment_cost_cents: z.number().int().nonnegative(), total_cost_cents: z.number().int().positive() });

export async function GET() { return NextResponse.json({ ok: true, shipments: await listShipments(await getScopedUserId()) }); }

export async function POST(req: NextRequest) {
  const userId = await getScopedUserId();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Please review the delivery details." }, { status: 400 });
  const input = parsed.data;
  const existing = await db.select().from(shippingOrders).where(and(eq(shippingOrders.userId, userId), eq(shippingOrders.cardId, input.card_id))).limit(1);
  if (existing[0]) return NextResponse.json({ ok: true, shipment: existing[0], duplicate: true });
  const id = `ship_${crypto.randomUUID()}`;
  const [shipment] = await db.insert(shippingOrders).values({ id, userId, cardId: input.card_id, cardSnapshot: input.card_snapshot, recipientName: input.recipient_name, email: input.email, phone: input.phone, street: input.street, unit: input.unit, city: input.city, state: input.state, postalCode: input.zip, country: input.country, shippingService: input.shipping_service, shippingCostCents: input.shipping_cost_cents, cardCostCents: input.card_cost_cents, fulfillmentCostCents: input.fulfillment_cost_cents, totalCostCents: input.total_cost_cents }).returning();
  await addEvent(id, "pending", "Shipment created and awaiting payment.");
  return NextResponse.json({ ok: true, shipment }, { status: 201 });
}
