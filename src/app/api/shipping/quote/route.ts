import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { quoteShipping } from "@/lib/shipping";

export async function POST(req: Request) {
  try {
    const { country } = await req.json();
    const rows = await db.execute(sql`SELECT base_fee_cents, card_fee_cents, international_surcharge_cents FROM public.shipping_config WHERE id = 1`);
    const config = rows.rows[0] as { base_fee_cents?: number; card_fee_cents?: number; international_surcharge_cents?: number } | undefined;
    return NextResponse.json({ ok: true, ...quoteShipping(String(country ?? "US"), config) });
  } catch { return NextResponse.json({ ok: false, error: "Could not calculate shipping." }, { status: 500 }); }
}
