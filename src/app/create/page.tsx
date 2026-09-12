"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Send } from "lucide-react";
import { CardEditor } from "./CardEditor";
import { Button } from "@/components/ui/button";
import type { CardDraft } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

const FIRST: Msg = {
  role: "assistant",
  content: "What should appear on the card as the organization or fan club name?",
};

export default function CreatePage() {
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

  if (card) return <CardEditor initial={card} />;

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
