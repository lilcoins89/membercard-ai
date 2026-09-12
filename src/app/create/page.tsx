"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Send, Share2, Download, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MembershipCard } from "@/components/card/MembershipCard";
import type { CardDraft } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

const FIRST: Msg = {
  role: "assistant",
  content: "What should appear on the card as the organization or fan club name?",
};

export default function CreatePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([FIRST]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [card, setCard] = useState<CardDraft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || loading || card) return;
    const next = [...messages, { role: "user" as const, content: value }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, photo_data_url: photo }),
      });
      const data = await res.json();
      if (data.message?.content) {
        setMessages((m) => [...m, { role: "assistant", content: data.message.content }]);
      }
      if (data.card) {
        setCard(data.card as CardDraft);
        try { sessionStorage.setItem("mc_card", JSON.stringify(data.card)); } catch { /* ignore */ }
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
    }
  }

  function onPhoto(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      setPhoto(url);
      void send("Photo uploaded");
    };
    reader.readAsDataURL(file);
  }

  function saveCard() {
    if (!card) return;
    try {
      sessionStorage.setItem("mc_card", JSON.stringify(card));
      alert("Card ready to ship or share.");
    } catch {
      alert("Could not save on this device.");
    }
  }

  async function shareCard() {
    if (!card) return;
    const text = `${card.organizationName} — ${card.memberName} (${card.membershipType}) #${card.memberNumber}`;
    if (navigator.share) {
      try { await navigator.share({ title: "My membership card", text }); return; } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(text);
    alert("Card details copied.");
  }

  function orderPhysical() {
    if (!card) return;
    try { sessionStorage.setItem("mc_card", JSON.stringify(card)); } catch { /* ignore */ }
    router.push("/order");
  }

  if (card) {
    return (
      <div className="min-h-dvh bg-background">
        <header className="mx-auto flex max-w-lg items-center gap-3 px-4 py-5">
          <Link href="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="size-5" /></Link>
          <span className="font-display text-lg font-medium">Your card is ready</span>
        </header>
        <main className="mx-auto max-w-lg px-4 pb-16">
          <p className="mb-6 text-center text-2xl">✨</p>
          <h1 className="mb-6 text-center font-display text-2xl font-medium tracking-tight">YOUR CARD IS READY</h1>
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
          <div className="mt-8 grid gap-3">
            <Button onClick={saveCard} className="w-full"><Download className="size-4" /> Save Card</Button>
            <Button variant="outline" onClick={() => void shareCard()} className="w-full"><Share2 className="size-4" /> Share Card</Button>
            <Button variant="secondary" onClick={orderPhysical} className="w-full"><Package className="size-4" /> Order Physical Card</Button>
          </div>
          <p className="mt-6 text-center">
            <button type="button" className="text-sm text-primary hover:underline" onClick={() => { setCard(null); setMessages([FIRST]); setPhoto(null); }}>
              Create another card
            </button>
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="size-5" /></Link>
        <div>
          <p className="font-display text-lg font-medium">Create with AI</p>
          <p className="text-xs text-muted-foreground">Answer a few questions — we design the card.</p>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-4">
        <div className="flex-1 space-y-3 overflow-y-auto py-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}>{m.content}</div>
            </div>
          ))}
          {loading && <p className="text-sm text-muted-foreground">Thinking…</p>}
          <div ref={bottomRef} />
        </div>
        {photo && (
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" className="size-8 rounded object-cover" />
            Photo attached
          </div>
        )}
        <form className="flex gap-2 border-t border-border pt-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
          <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} aria-label="Upload photo">
            <ImagePlus className="size-4" />
          </Button>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your answer…"
            className="h-11 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <Button type="submit" disabled={loading || !input.trim()}><Send className="size-4" /></Button>
        </form>
      </div>
    </div>
  );
}
