"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MembershipCard } from "@/components/card/MembershipCard";
import type { CardDraft, ShippingRate } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

export default function OrderPage() {
  const [card, setCard] = useState<CardDraft | null>(null);
  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selected, setSelected] = useState<ShippingRate | null>(null);
  const [cardPrice, setCardPrice] = useState(199);
  const [fulfillment, setFulfillment] = useState(125);
  const [loadingRates, setLoadingRates] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("mc_card");
      if (raw) {
        const c = JSON.parse(raw) as CardDraft;
        setCard(c);
        setFullName(c.memberName);
      }
    } catch { /* ignore */ }
  }, []);

  async function loadRates() {
    setError(null);
    setLoadingRates(true);
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName, street, unit: unit || null, city, state, zip,
          country: "United States", phone: phone || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not load rates");
      setRates(data.rates || []);
      setSelected((data.rates && data.rates[0]) || null);
      if (data.card_price_cents) setCardPrice(data.card_price_cents);
      if (data.fulfillment_cents) setFulfillment(data.fulfillment_cents);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not calculate shipping");
      setRates([]);
    } finally {
      setLoadingRates(false);
    }
  }

  async function checkout() {
    if (!selected || !card) return;
    setCheckingOut(true);
    setError(null);
    const amount = cardPrice + fulfillment + selected.amount_cents;
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: `ord_${Date.now()}`,
          amount_cents: amount,
          description: `Physical membership card — ${card.memberName}`,
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.checkout_url) throw new Error(data.error || "Checkout failed");
      window.location.href = data.checkout_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setCheckingOut(false);
    }
  }

  const total = cardPrice + fulfillment + (selected?.amount_cents ?? 0);

  if (!card) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">No card to order yet.</p>
          <Button asChild className="mt-4"><Link href="/create">Create a card</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-lg items-center gap-3 px-4 py-5">
        <Link href="/create" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="size-5" /></Link>
        <span className="font-display text-lg font-medium">Order physical card</span>
      </header>
      <main className="mx-auto max-w-lg space-y-6 px-4 pb-20">
        <MembershipCard
          model={{
            organizationName: card.organizationName,
            memberName: card.memberName,
            memberNumber: card.memberNumber,
            membershipType: card.membershipType,
            expiration: card.expiration,
            photoUrl: card.photoDataUrl,
            status: "active",
            design: card.design,
          }}
          className="mx-auto"
        />
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-medium">Where should we deliver your card?</h2>
          <p className="text-sm text-muted-foreground">U.S. addresses only.</p>
          <div>
            <label className="mb-1 block text-[13px] font-medium">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium">Street address</label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium">Apt / Unit (optional)</label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[13px] font-medium">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium">State</label>
              <select className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm" value={state} onChange={(e) => setState(e.target.value)}>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[13px] font-medium">ZIP code</label>
              <Input value={zip} onChange={(e) => setZip(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full" disabled={loadingRates || !fullName || !street || !city || !zip} onClick={() => void loadRates()}>
            {loadingRates ? "Calculating…" : "Calculate shipping"}
          </Button>
        </section>

        {rates.length > 0 && (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-medium">Shipping</h2>
            <div className="space-y-2">
              {rates.map((r) => (
                <label key={r.service_code} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                  selected?.service_code === r.service_code ? "border-primary bg-primary/5" : "border-border"
                }`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="ship" checked={selected?.service_code === r.service_code} onChange={() => setSelected(r)} />
                    <span>
                      <span className="font-medium">{r.service}</span>
                      <span className="block text-xs text-muted-foreground">{r.carrier} · ~{r.estimated_days} day{r.estimated_days === 1 ? "" : "s"}</span>
                    </span>
                  </span>
                  <span className="tabular-nums">{formatMoney(r.amount_cents)}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Card</span><span>{formatMoney(cardPrice)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Production</span><span>{formatMoney(fulfillment)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatMoney(selected?.amount_cents ?? 0)}</span></div>
              <div className="flex justify-between pt-1 text-base font-medium"><span>Total</span><span>{formatMoney(total)}</span></div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={!selected || checkingOut} onClick={() => void checkout()}>
              <Package className="size-4" />{checkingOut ? "Redirecting…" : "Pay & order"}
            </Button>
          </section>
        )}
        {error && rates.length === 0 && <p className="text-sm text-destructive">{error}</p>}
      </main>
    </div>
  );
}
