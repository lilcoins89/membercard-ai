import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getFulfillmentProvider } from "@/lib/fulfillment";
import type { CreateFulfillmentOrderInput } from "@/lib/fulfillment/types";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const stripe = new Stripe(secret, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", webhookSecret); } catch { return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.shipment_id ?? session.client_reference_id;
    if (id) {
      await db.execute(sql`UPDATE public.shipment_orders SET payment_status = 'paid', fulfillment_status = 'payment_confirmed', stripe_payment_intent_id = ${String(session.payment_intent ?? "")}, updated_at = now() WHERE id = ${id} AND payment_status = 'pending'`);
      try {
        const rows = await db.execute(sql`SELECT id, card_snapshot, recipient_name, email, phone, street, unit, city, state, postal_code, country, idempotency_key, shipping_cost_cents FROM public.shipment_orders WHERE id = ${id}`);
        const shipment = rows.rows[0] as Record<string, unknown> | undefined;
        if (shipment) {
          const card = (shipment.card_snapshot ?? {}) as Record<string, unknown>;
          const provider = getFulfillmentProvider();
          const input: CreateFulfillmentOrderInput = { idempotency_key: String(shipment.idempotency_key), product_sku: "membership-pvc-card", quantity: 1, shipping: { service: "Configured delivery", service_code: "configured", carrier: "provider", amount_cents: Number(shipment.shipping_cost_cents), currency: "usd", estimated_days: 7 }, address: { full_name: String(shipment.recipient_name), phone: String(shipment.phone ?? ""), street: String(shipment.street), unit: String(shipment.unit ?? ""), city: String(shipment.city), state: String(shipment.state ?? ""), zip: String(shipment.postal_code), country: String(shipment.country) }, artwork: { card_id: String(shipment.id), member_name: String(card.memberName ?? ""), member_number: String(card.memberNumber ?? ""), membership_type: String(card.membershipType ?? ""), expiration_date: card.expiration ? String(card.expiration) : null, organization_name: String(card.organizationName ?? ""), design: card.design as never } };
          const result = await provider.createOrder(input);
          await db.execute(sql`UPDATE public.shipment_orders SET fulfillment_status = 'processing', provider_order_id = ${result.id}, tracking_number = ${result.tracking_number ?? null}, tracking_url = ${result.tracking_url ?? null}, estimated_delivery = ${result.estimated_delivery ? new Date(result.estimated_delivery) : null}, updated_at = now() WHERE id = ${id}`);
        }
      } catch (error) { await db.execute(sql`UPDATE public.shipment_orders SET fulfillment_status = 'failed', error_message = ${error instanceof Error ? error.message : "Fulfillment failed"}, updated_at = now() WHERE id = ${id}`); }
    }
  }
  if (event.type === "charge.refunded") { const charge = event.data.object as Stripe.Charge; await db.execute(sql`UPDATE public.shipment_orders SET payment_status = 'refunded', fulfillment_status = 'refunded', updated_at = now() WHERE stripe_payment_intent_id = ${String(charge.payment_intent ?? "")}`); }
  return NextResponse.json({ received: true });
}
