"use client";

/* The member photo is a local data URL selected in the browser, so next/image cannot optimize it. */
/* eslint-disable @next/next/no-img-element */
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, MessageCircle, Send, Sparkles } from "lucide-react";
import { CardEditor } from "./CardEditor";
import { MembershipCard } from "@/components/card/MembershipCard";
import { Button } from "@/components/ui/button";
import type { CardDraft } from "@/lib/types";

type FormState = { organization: string; member: string; membership: string; expiration: string };

export default function CreatePage() {
  const [details, setDetails] = useState<FormState>({ organization: "", member: "", membership: "", expiration: "" });
  const [photo, setPhoto] = useState<string | null>(null);
  const [card, setCard] = useState<CardDraft | null>(null);
  const [preview, setPreview] = useState<CardDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "I can help you create the card. Tell me the organization or fan club name to begin." },
  ]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPhoto(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || chatLoading) return;
    const nextMessages = [...chatMessages, { role: "user" as const, content }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: nextMessages, photo_data_url: photo }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The AI assistant is unavailable.");
      setChatMessages((current) => [...current, data.message]);
      if (data.card) setPreview(data.card as CardDraft);
    } catch (cause) {
      setChatMessages((current) => [...current, { role: "assistant", content: cause instanceof Error ? cause.message : "The AI assistant is unavailable." }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function createCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo) { setError("Please upload a member image before creating the card."); return; }
    setLoading(true); setError(null);
    const messages = [details.organization, details.member, "Photo uploaded", details.membership, details.expiration || "none"]
      .map((content) => ({ role: "user" as const, content }));
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, photo_data_url: photo }) });
      const data = await response.json();
      if (!response.ok || !data.card) throw new Error(data.error ?? "Unable to create your card.");
      setPreview(data.card as CardDraft);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create your card.");
    } finally { setLoading(false); }
  }

  if (card) return <CardEditor initial={card} />;
  if (preview) return <PreviewCard card={preview} onBack={() => setPreview(null)} onContinue={() => { setCard(preview); try { sessionStorage.setItem("mc_card", JSON.stringify(preview)); } catch { /* ignore */ } }} />;

  return (
    <main className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 py-5">
        <Link href="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="size-5" /></Link>
        <div><p className="font-display text-lg font-medium">Create your membership card</p><p className="text-xs text-muted-foreground">Tell us about the member and add a photo. You&apos;ll preview it before anything is saved.</p></div>
      </header>
      <section className="mx-auto mb-6 w-full max-w-3xl px-5">
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 shadow-soft">
          <button type="button" onClick={() => setChatOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-primary/10" aria-expanded={chatOpen}>
            <span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><MessageCircle className="size-4" /></span><span><span className="block text-sm font-semibold">Build with the AI assistant</span><span className="block text-xs text-muted-foreground">Answer in chat or use the form below. Your preview appears before anything is saved.</span></span></span><span className="text-xs font-medium text-primary">{chatOpen ? "Hide" : "Open"}</span>
          </button>
          {chatOpen && <div className="border-t border-primary/15 bg-card/70 p-4">
            <div className="max-h-52 space-y-3 overflow-y-auto pr-1" aria-live="polite">
              {chatMessages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-8 rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" : "mr-8 rounded-xl border bg-background px-3 py-2 text-sm"}>{message.content}</div>)}
              {chatLoading && <div className="mr-8 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">Thinking…</div>}
            </div>
            <form onSubmit={sendChatMessage} className="mt-3 flex gap-2"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Tell the assistant what you want on the card…" aria-label="Message the AI assistant" className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()} aria-label="Send message"><Send /></Button></form>
          </div>}
        </div>
      </section>
      <form onSubmit={createCard} className="mx-auto grid w-full max-w-3xl gap-6 px-5 pb-12 lg:grid-cols-[1fr_0.75fr]">
        <section className="rounded-2xl border bg-card p-6 shadow-soft"><p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">01 · Membership details</p><h1 className="mt-2 font-display text-3xl">Let&apos;s make it personal.</h1><div className="mt-7 grid gap-4">
          {([["organization", "Organization or club name", "e.g. Northstar FC"], ["member", "Member name", "e.g. Avery Chen"], ["membership", "Membership level", "e.g. VIP, Gold, Fan"]] as const).map(([key, label, placeholder]) => <label key={key} className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span><input required value={details[key]} onChange={(e) => setDetails({ ...details, [key]: e.target.value })} placeholder={placeholder} className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" /></label>)}
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Expiration date <span className="font-normal text-muted-foreground">(optional)</span></span><input type="date" value={details.expiration} onChange={(e) => setDetails({ ...details, expiration: e.target.value })} className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" /></label>
        </div></section>
        <section className="rounded-2xl border bg-card p-6 shadow-soft"><p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">02 · Member image</p><h2 className="mt-2 font-display text-2xl">Add the face of the card.</h2><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} /><button type="button" onClick={() => fileRef.current?.click()} className="mt-6 flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center hover:bg-primary/10">{photo ? <><span className="sr-only">Selected member image</span><img src={photo} alt="Selected member" className="size-28 rounded-xl object-cover" /></> : <ImagePlus className="size-8 text-primary" />}<span className="text-sm font-medium">{photo ? "Change image" : "Upload member image"}</span><span className="text-xs text-muted-foreground">PNG, JPG, or WebP</span></button><Button type="submit" className="mt-5 w-full" disabled={loading}>{loading ? "Creating preview…" : <><Sparkles data-icon="inline-start" /> Create card preview</>}</Button>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}</section>
      </form>
    </main>
  );
}

function PreviewCard({ card, onBack, onContinue }: { card: CardDraft; onBack: () => void; onContinue: () => void }) {
  return <main className="min-h-dvh bg-background"><header className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5"><button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground" aria-label="Back to details"><ArrowLeft className="size-5" /></button><div><p className="font-display text-lg font-medium">Preview your card</p><p className="text-xs text-muted-foreground">Nothing is saved until you approve this preview.</p></div></header><section className="mx-auto max-w-3xl px-5 pb-12"><div className="rounded-2xl border bg-card p-5 shadow-soft md:p-8"><p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">03 · Review</p><h1 className="mt-2 font-display text-3xl">This is your card.</h1><div className="mt-8 grid gap-6 md:grid-cols-2"><div className="grid gap-2"><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Front</p><MembershipCard model={{ organizationName: card.organizationName, memberName: card.memberName, memberNumber: card.memberNumber, membershipType: card.membershipType, expiration: card.expiration, photoUrl: card.photoDataUrl, status: card.status, design: card.design }} face="front" /></div><div className="grid gap-2"><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Back</p><MembershipCard model={{ organizationName: card.organizationName, memberName: card.memberName, memberNumber: card.memberNumber, membershipType: card.membershipType, expiration: card.expiration, photoUrl: card.photoDataUrl, status: card.status, design: card.design }} face="back" /></div></div><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onBack}>Edit details</Button><Button type="button" onClick={onContinue}>Approve and customize</Button></div></div></section></main>;
}
