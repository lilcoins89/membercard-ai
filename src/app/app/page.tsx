import Link from "next/link";
import { Users, CreditCard, Package, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

const DEMO_STATS = {
  total_members: 428, active: 391, expiring_soon: 12, expired: 18,
  digital_issued: 402, physical_ordered: 47, shipped: 31, revenue_cents: 26840, in_production: 4,
};

export default function DashboardPage() {
  const s = DEMO_STATS;
  const tiles = [
    { label: "Total members", value: s.total_members, icon: Users },
    { label: "Active memberships", value: s.active, icon: Users },
    { label: "Expiring soon", value: s.expiring_soon, icon: AlertTriangle },
    { label: "Digital cards issued", value: s.digital_issued, icon: CreditCard },
    { label: "Physical ordered", value: s.physical_ordered, icon: Package },
    { label: "Cards shipped", value: s.shipped, icon: Package },
    { label: "Revenue", value: formatMoney(s.revenue_cents), icon: CreditCard },
    { label: "In production", value: s.in_production, icon: Package },
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Memberships, cards, and fulfillment at a glance.</p>
        </div>
        <Button asChild><Link href="/app/ai"><Sparkles className="size-4" /> Open AI</Link></Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-[13px] text-muted-foreground">{t.label}</p>
                  <p className="mt-1 font-display text-2xl font-medium tabular-nums">{t.value}</p>
                </div>
                <span className="grid size-9 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Icon className="size-4" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader><CardTitle>AI insights</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {["12 memberships expire this week.", "8 members have not activated their cards.", "4 physical cards are in production."].map((t) => (
            <div key={t} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
              <p className="text-sm">{t}</p>
              <Button asChild variant="outline" size="sm"><Link href="/app/ai">Fix with AI <ArrowRight className="size-3.5" /></Link></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
