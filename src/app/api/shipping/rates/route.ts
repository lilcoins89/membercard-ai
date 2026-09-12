import { NextRequest, NextResponse } from "next/server";
import { getFulfillmentProvider } from "@/lib/fulfillment";
import { z } from "zod";

const addressSchema = z.object({
  full_name: z.string().min(1),
  street: z.string().min(1),
  unit: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().default("United States"),
  phone: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Enter a valid U.S. shipping address." }, { status: 400 });
    }
    if (!/^united states|usa|us$/i.test(parsed.data.country)) {
      return NextResponse.json({ ok: false, error: "Physical cards currently ship only within the United States." }, { status: 400 });
    }
    const provider = getFulfillmentProvider(process.env.FULFILLMENT_PROVIDER);
    const products = await provider.getProducts();
    const rates = await provider.getShippingRates({ ...parsed.data, country: "United States" });
    const shippingMarkup = Number(process.env.SHIPPING_MARKUP_CENTS ?? 0);
    const fulfillmentMarkup = Number(process.env.FULFILLMENT_MARKUP_CENTS ?? 0);
    const cardPrice = Number(process.env.CARD_PRICE_CENTS ?? 199);
    const pvc = products[0];
    return NextResponse.json({
      ok: true,
      rates: rates.map((r) => ({ ...r, amount_cents: r.amount_cents + shippingMarkup })),
      card_price_cents: cardPrice,
      fulfillment_cents: (pvc?.unit_cents ?? 125) + fulfillmentMarkup,
      product: pvc,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "We couldn't calculate shipping right now." }, { status: 500 });
  }
}
