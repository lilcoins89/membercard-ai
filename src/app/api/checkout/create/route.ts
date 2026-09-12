import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { order_id: string; amount_cents: number; description?: string };
    if (!body.order_id || !body.amount_cents || body.amount_cents < 50) {
      return NextResponse.json({ ok: false, error: "Invalid checkout request." }, { status: 400 });
    }
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? "http://localhost:3000";
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({
        ok: true,
        demo: true,
        order_id: body.order_id,
        checkout_url: `${origin}/order/success?order=${encodeURIComponent(body.order_id)}`,
      });
    }
    const stripe = new Stripe(secret, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: `${origin}/order/success?order=${encodeURIComponent(body.order_id)}`,
        cancel_url: `${origin}/order`,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: body.amount_cents,
            product_data: { name: body.description ?? "Physical membership card" },
          },
        }],
        client_reference_id: body.order_id,
        metadata: { order_id: body.order_id },
      },
      { idempotencyKey: `checkout_${body.order_id}` },
    );
    return NextResponse.json({ ok: true, order_id: body.order_id, session_id: session.id, checkout_url: session.url });
  } catch (err) {
    console.error("[checkout/create]", err);
    return NextResponse.json({ ok: false, error: "Checkout could not be started." }, { status: 500 });
  }
}
