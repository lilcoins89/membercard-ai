import Link from "next/link";
import { ArrowRight, CreditCard, Package, Plus, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MembershipCard } from "@/components/card/MembershipCard";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import type { CardDesign } from "@/lib/types";
import { DashboardCardPreview } from "./DashboardCardPreview";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  try {
    const result = await db.execute(sql`SELECT id, recipient_name, country, fulfillment_status, tracking_number, created_at FROM public.shipment_orders ORDER BY created_at DESC LIMIT 5`);
    const shipments = result.rows as Array<Record<string, string | null>>;
    const cards = await db.execute(sql`SELECT id, public_membership_id, member_name, organization_name, membership_type, expiration_date, design, created_at FROM public.membership_cards ORDER BY created_at DESC LIMIT 1`);
    return { shipments, card: cards.rows[0] as Record<string, unknown> | undefined, connected: true };
  } catch {
    return { shipments: [], connected: false };
  }
}

export default async function DashboardPage() {
  const { shipments, card, connected } = await getDashboardData();
  return <main className="min-h-dvh bg-background">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">M</span><span className="font-display text-xl">MemberCard AI</span></Link>
      <div className="flex items-center gap-2"><Button asChild variant="outline" size="sm"><Link href="/shipments"><Truck className="size-4" /> Shipments</Link></Button><Button asChild size="sm"><Link href="/create"><Plus className="size-4" /> New card</Link></Button></div>
    </header>
    <section className="mx-auto max-w-6xl space-y-8 px-5 pb-16 lg:px-8">
      <div><p className="text-sm text-primary">Workspace overview</p><h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">Your membership desk</h1><p className="mt-3 max-w-xl text-muted-foreground">Create, manage, and deliver the cards that make your community feel real.</p></div>
      <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><Sparkles className="size-5 text-primary" /><p className="mt-5 text-3xl font-semibold">{card ? "01" : "00"}</p><p className="mt-1 text-sm text-muted-foreground">Cards created</p></div><div className="rounded-2xl border border-border bg-card p-5"><Package className="size-5 text-primary" /><p className="mt-5 text-3xl font-semibold">{shipments.length.toString().padStart(2, "0")}</p><p className="mt-1 text-sm text-muted-foreground">Shipments placed</p></div><div className="rounded-2xl border border-border bg-card p-5"><CreditCard className="size-5 text-primary" /><p className="mt-5 text-3xl font-semibold">{connected ? "Live" : "Offline"}</p><p className="mt-1 text-sm text-muted-foreground">Neon workspace</p></div></div>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-primary">Latest card</p><h2 className="mt-2 font-display text-2xl">Your membership card</h2></div><Button asChild variant="ghost" size="sm"><Link href="/create">Edit <ArrowRight className="size-4" /></Link></Button></div>{card ? <DashboardCardPreview card={{ organizationName: String(card.organization_name ?? "MemberCard AI"), memberName: String(card.member_name ?? "Member"), memberNumber: String(card.public_membership_id ?? ""), membershipType: String(card.membership_type ?? "Member"), expiration: card.expiration_date ? String(card.expiration_date) : null, design: card.design as CardDesign }} /> : <div className="mt-8 rounded-xl bg-secondary/50 p-5 text-sm text-muted-foreground">No saved membership card yet. Create your first card to activate this workspace.</div>}</section><section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-primary">Delivery</p><h2 className="mt-2 font-display text-2xl">Recent shipments</h2></div><Truck className="size-5 text-primary" /></div>{shipments.length === 0 ? <div className="mt-10 rounded-xl bg-secondary/50 p-5 text-sm text-muted-foreground">No shipments yet. Create a card and send one to your members.</div> : <div className="mt-6 space-y-3">{shipments.map((shipment) => <div key={String(shipment.id)} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"><div><p className="font-medium">{shipment.recipient_name}</p><p className="text-xs text-muted-foreground">{shipment.country}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize">{String(shipment.fulfillment_status).replaceAll("_", " ")}</span></div>)}</div>}<Button asChild className="mt-6 w-full" variant="outline"><Link href="/shipments">View delivery timeline <ArrowRight className="size-4" /></Link></Button></section></div>
    </section>
  </main>;
}
