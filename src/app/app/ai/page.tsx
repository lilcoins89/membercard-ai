"use client";

import { useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; content: string };

const STARTER: Msg[] = [{
  role: "assistant",
  content: "Let's create your membership program. What is the name of your organization?",
}];

export default function AIPage() {
  const [messages, setMessages] = useState<Msg[]>(STARTER);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.message?.content ?? data.error ?? "Done." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "AI is temporarily unavailable." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl min-h-[70vh] flex-col rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Sparkles className="size-4 text-primary" />
        <div>
          <h1 className="font-display text-lg font-medium">AI assistant</h1>
          <p className="text-xs text-muted-foreground">Tell AI what you need. It creates members, cards, and designs.</p>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="text-sm text-muted-foreground">Thinking…</div>}
        <div ref={bottomRef} />
      </div>
      <form className="flex gap-2 border-t border-border p-4" onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Royal Fitness Club, Premium membership…"
          className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <Button type="submit" disabled={loading || !input.trim()}><Send className="size-4" /> Send</Button>
      </form>
    </div>
  );
}
