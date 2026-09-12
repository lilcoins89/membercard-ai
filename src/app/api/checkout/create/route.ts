import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shippingOrders } from "@/lib/db/schema";
import { getScopedUserId, addEvent } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { order_id: string; shipment_id?: string; description?: string };
    if (!body.order_id) return NextResponse.json({ ok: false, error: "Invalid checkout request." }, { status: 400 });
    const userId = await getScopedUserId();
    const [shipment] = await db.select().from(shippingOrders).where(and(eq(shippingOrders.id, body.shipment_id ?? body.order_id), eq(shippingOrders.userId, userId))).limit(1);
    if (!shipment) return NextResponse.json({ ok: false, error: "Shipment not found." }, { status: 404 });
    if (shipment.paymentStatus === "paid" || shipment.paymentStatus === "confirmed") return NextResponse.json({ ok: true, order_id: shipment.id, checkout_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/order/success?order=${encodeURIComponent(shipment.id)}` });
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? "http://localhost:3000";
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      await db.update(shippingOrders).set({ paymentStatus: "confirmed", fulfillmentStatus: "processing", updatedAt: new Date() }).where(eq(shippingOrders.id, shipment.id));
      await addEvent(shipment.id, "payment_confirmed", "Test payment confirmed.");
      await addEvent(shipment.id, "processing", "Shipment is ready for fulfillment.");
      return NextResponse.json({
        ok: true,
        demo: true,
        order_id: shipment.id,
        checkout_url: `${origin}/order/success?order=${encodeURIComponent(shipment.id)}`,
      });
    }
    const stripe = new Stripe(secret, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: `${origin}/order/success?order=${encodeURIComponent(shipment.id)}`,
        cancel_url: `${origin}/order`,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: shipment.totalCostCents,
            product_data: { name: body.description ?? "Physical membership card" },
          },
        }],
        client_reference_id: shipment.id,
        metadata: { order_id: shipment.id },
      },
      { idempotencyKey: `checkout_${body.order_id}` },
    );
    return NextResponse.json({ ok: true, order_id: body.order_id, session_id: session.id, checkout_url: session.url });
  } catch (err) {
    console.error("[checkout/create]", err);
    return NextResponse.json({ ok: false, error: "Checkout could not be started." }, { status: 500 });
  }
}
