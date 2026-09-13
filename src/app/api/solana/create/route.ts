import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { createSolanaPayUrl } from "@/lib/solana";

export async function POST(req: Request) {
  try {
    const { shipment_id } = await req.json();
    const rows = await db.execute(sql`SELECT id, total_cents, payment_status FROM public.shipment_orders WHERE id = ${shipment_id}`);
    const shipment = rows.rows[0] as { id: string; total_cents: number; payment_status: string } | undefined;
    if (!shipment || shipment.payment_status !== "pending") return NextResponse.json({ ok: false, error: "Shipment is not payable." }, { status: 400 });
    const reference = crypto.randomBytes(32).toString("hex");
    const referenceBase58 = new PublicKey(Buffer.from(reference, "hex")).toBase58();
    const url = createSolanaPayUrl({ amountCents: shipment.total_cents, reference: referenceBase58 });
    await db.execute(sql`UPDATE public.shipment_orders SET payment_provider = 'solana', solana_reference = ${referenceBase58}, updated_at = now() WHERE id = ${shipment.id} AND payment_status = 'pending'`);
    return NextResponse.json({ ok: true, url, reference: referenceBase58, amount_cents: shipment.total_cents, network: "mainnet-beta" });
  } catch (error) {
    console.error("[solana/create]", error);
    return NextResponse.json({ ok: false, error: "Solana payment could not be created." }, { status: 500 });
  }
}
