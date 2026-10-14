import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { SOLANA_TREASURY } from "@/lib/solana";

const rpcUrl = () => {
  const configured = process.env.HELIUS_RPC;
  if (configured) return configured.includes("api-key=") || configured.includes("apiKey=") ? configured : `${configured}${configured.includes("?") ? "&" : "?"}api-key=${encodeURIComponent(process.env.HELIUS_API ?? "")}`;
  return `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(process.env.HELIUS_API ?? "")}`;
};

async function heliusRpc(method: string, params: unknown[], id: number) {
  const response = await fetch(rpcUrl(), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id, method, params }), cache: "no-store" });
  if (!response.ok) throw new Error(`Helius RPC returned ${response.status}.`);
  const payload = await response.json();
  if (payload.error) throw new Error("Helius RPC rejected the request.");
  return payload.result;
}

export async function POST(req: Request) {
  try {
    const { shipment_id, signature, email } = await req.json();
    if (!shipment_id || typeof signature !== "string" || signature.length < 10 || typeof email !== "string" || !email.includes("@")) return NextResponse.json({ ok: false, error: "A valid payment signature is required." }, { status: 400 });
    if (!process.env.HELIUS_API && !process.env.HELIUS_RPC) return NextResponse.json({ ok: false, error: "Solana verification is not configured." }, { status: 503 });
    const usdcMint = process.env.SOL_USDC_MINT?.trim();
    if (!usdcMint) return NextResponse.json({ ok: false, error: "USDC mint is not configured on the server." }, { status: 503 });

    const rows = await db.execute(sql`SELECT id, total_cents, solana_reference, solana_amount_lamports, payment_status, user_id FROM public.shipment_orders WHERE id = ${shipment_id}`);
    const order = rows.rows[0] as { id: string; total_cents: number; solana_reference: string | null; solana_amount_lamports: number | null; payment_status: string; user_id: string } | undefined;
    if (!order || !order.solana_reference || order.payment_status !== "pending") return NextResponse.json({ ok: false, error: "Payment intent is unavailable." }, { status: 400 });

    const signatures = await heliusRpc("getSignaturesForAddress", [order.solana_reference, { limit: 50 }], 1) as Array<{ signature: string; err: unknown }> | undefined;
    if (!signatures?.some((item) => item.signature === signature && !item.err)) return NextResponse.json({ ok: false, error: "Payment signature was not found for this payment reference." }, { status: 400 });

    const transaction = await heliusRpc("getTransaction", [signature, { encoding: "jsonParsed", commitment: "finalized", maxSupportedTransactionVersion: 0 }], 2);
    if (!transaction?.meta || transaction.meta.err || !transaction.blockTime) return NextResponse.json({ ok: false, error: "Payment is not finalized or failed." }, { status: 400 });

    let receivedUsdcAtomic = 0n;
    if (Array.isArray(transaction.tokenTransfers)) {
      for (const transfer of transaction.tokenTransfers as Array<{ mint?: string; to?: string; amount?: string | number }>) {
        if (transfer.mint === usdcMint && transfer.to === SOLANA_TREASURY) {
          const amount = BigInt(String(transfer.amount ?? "0"));
          receivedUsdcAtomic += amount;
        }
      }
    }

    if (receivedUsdcAtomic === 0n && Array.isArray(transaction.meta?.postTokenBalances) && Array.isArray(transaction.meta?.preTokenBalances)) {
      const postBalances = transaction.meta.postTokenBalances as Array<{ mint?: string; owner?: string; accountIndex?: number; uiTokenAmount?: { amount?: string } }>;
      const preBalances = transaction.meta.preTokenBalances as Array<{ mint?: string; owner?: string; accountIndex?: number; uiTokenAmount?: { amount?: string } }>;
      for (const postBalance of postBalances) {
        if (postBalance.mint !== usdcMint || postBalance.owner !== SOLANA_TREASURY) continue;
        const previous = preBalances.find((preBalance) => preBalance.accountIndex === postBalance.accountIndex && preBalance.mint === postBalance.mint && preBalance.owner === postBalance.owner);
        const postAmount = BigInt(String(postBalance.uiTokenAmount?.amount ?? "0"));
        const preAmount = BigInt(String(previous?.uiTokenAmount?.amount ?? "0"));
        if (postAmount > preAmount) receivedUsdcAtomic += postAmount - preAmount;
      }
    }

    if (receivedUsdcAtomic === 0n) return NextResponse.json({ ok: false, error: "No USDC token transfer to treasury was detected in this transaction." }, { status: 400 });

    const expectedAtomic = BigInt(order.total_cents) * 10000n;
    if (receivedUsdcAtomic < expectedAtomic) return NextResponse.json({ ok: false, error: "USDC amount is lower than the order total." }, { status: 400 });

    try {
      await db.execute(sql`INSERT INTO public.wallet_deposits (user_id, order_id, asset, amount_atomic, amount_usd_cents, signature, status, confirmed_at) VALUES (${order.user_id}, ${order.id}, 'USDC', ${String(receivedUsdcAtomic)}, ${order.total_cents}, ${signature}, 'confirmed', now())`);
    } catch (error) {
      console.error("[solana/verify] wallet_deposits insert failed", error);
      return NextResponse.json({ ok: false, error: "This payment signature has already been used or is invalid." }, { status: 400 });
    }

    await db.execute(sql`UPDATE public.shipment_orders SET payment_status = 'paid', solana_signature = ${signature}, payment_provider = 'solana_usdc', usdc_amount = ${Number(receivedUsdcAtomic <= 9007199254740991n ? receivedUsdcAtomic : 0n)}, email = ${email.toLowerCase().trim()}, paid_at = now(), updated_at = now() WHERE id = ${order.id} AND payment_status = 'pending'`);

    return NextResponse.json({ ok: true, paid: true });
  } catch (error) {
    console.error("[solana/verify]", error);
    return NextResponse.json({ ok: false, error: "Payment verification failed." }, { status: 500 });
  }
}
