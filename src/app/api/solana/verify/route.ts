import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { SOLANA_TREASURY } from "@/lib/solana";

const rpcUrl = () => `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

export async function POST(req: Request) {
  try {
    const { shipment_id, signature, email } = await req.json();
    if (!shipment_id || typeof signature !== "string" || signature.length < 80 || typeof email !== "string" || !email.includes("@")) return NextResponse.json({ ok: false, error: "A valid payment signature is required." }, { status: 400 });
    if (!process.env.HELIUS_API_KEY) return NextResponse.json({ ok: false, error: "Solana verification is not configured." }, { status: 503 });
    const rows = await db.execute(sql`SELECT id, total_cents, solana_reference, payment_status FROM public.shipment_orders WHERE id = ${shipment_id}`);
    const order = rows.rows[0] as { id: string; total_cents: number; solana_reference: string | null; payment_status: string } | undefined;
    if (!order || !order.solana_reference || order.payment_status !== "pending") return NextResponse.json({ ok: false, error: "Payment intent is unavailable." }, { status: 400 });
    const signaturesResponse = await fetch(rpcUrl(), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSignaturesForAddress", params: [order.solana_reference, { limit: 20 }] }) });
    const signatures = (await signaturesResponse.json())?.result as Array<{ signature: string; err: unknown }> | undefined;
    if (!signatures?.some((item) => item.signature === signature && !item.err)) return NextResponse.json({ ok: false, error: "Payment signature was not found for this payment reference." }, { status: 400 });
    const txResponse = await fetch(rpcUrl(), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "getTransaction", params: [signature, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }] }) });
    const transaction = (await txResponse.json())?.result;
    if (!transaction?.meta || transaction.meta.err) return NextResponse.json({ ok: false, error: "Payment is not confirmed." }, { status: 400 });
    const keys = transaction.transaction.message.accountKeys as Array<{ pubkey: string }>;
    const treasuryIndex = keys.findIndex((key) => key.pubkey === SOLANA_TREASURY);
    const receivedLamports = treasuryIndex >= 0 ? Number(transaction.meta.postBalances[treasuryIndex]) - Number(transaction.meta.preBalances[treasuryIndex]) : 0;
    const requiredLamports = Math.round(Number(order.total_cents) * 10_000);
    if (receivedLamports < requiredLamports) return NextResponse.json({ ok: false, error: "Payment amount is lower than the order total." }, { status: 400 });
    await db.execute(sql`UPDATE public.shipment_orders SET payment_status = 'paid', solana_signature = ${signature}, email = ${email.toLowerCase().trim()}, paid_at = now(), updated_at = now() WHERE id = ${order.id} AND payment_status = 'pending'`);
    return NextResponse.json({ ok: true, paid: true });
  } catch (error) {
    console.error("[solana/verify]", error);
    return NextResponse.json({ ok: false, error: "Payment verification failed." }, { status: 500 });
  }
}
