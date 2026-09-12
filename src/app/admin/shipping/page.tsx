import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  let shipments: Array<Record<string, string | number | null>> = [];
  try {
    const result = await db.execute(sql`SELECT id, user_id, recipient_name, country, total_cents, payment_status, fulfillment_status, tracking_number, error_message, created_at FROM public.shipment_orders ORDER BY created_at DESC LIMIT 100`);
    shipments = result.rows as Array<Record<string, string | number | null>>;
  } catch {
    shipments = [];
  }
  return <main className="min-h-dvh bg-background"><header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5"><Link href="/" className="text-muted-foreground"><ArrowLeft className="size-5" /></Link><div><p className="font-display text-lg">Shipping operations</p><p className="text-xs text-muted-foreground">Private admin workspace</p></div></header><section className="mx-auto max-w-6xl space-y-5 px-4 pb-16"><div><h1 className="font-display text-3xl">Shipment orders</h1><p className="mt-1 text-sm text-muted-foreground">Review payment and provider-confirmed fulfillment state.</p></div><div className="overflow-x-auto rounded-2xl border border-border bg-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Order</th><th className="p-4">Recipient</th><th className="p-4">Payment</th><th className="p-4">Fulfillment</th><th className="p-4">Tracking</th><th className="p-4">Total</th></tr></thead><tbody>{shipments.map((shipment) => <tr key={String(shipment.id)} className="border-b border-border last:border-0"><td className="p-4 font-mono text-xs">{String(shipment.id).slice(0, 8)}…</td><td className="p-4"><p>{shipment.recipient_name}</p><p className="text-xs text-muted-foreground">{shipment.country}</p></td><td className="p-4 capitalize">{String(shipment.payment_status).replaceAll("_", " ")}</td><td className="p-4 capitalize">{String(shipment.fulfillment_status).replaceAll("_", " ")}{shipment.error_message && <p className="mt-1 max-w-[180px] text-xs text-destructive">{shipment.error_message}</p>}</td><td className="p-4">{shipment.tracking_number ? <span className="flex items-center gap-1">{shipment.tracking_number} <ExternalLink className="size-3" /></span> : "—"}</td><td className="p-4">${(Number(shipment.total_cents) / 100).toFixed(2)}</td></tr>)}</tbody></table></div></section></main>;
}
