import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">M</span>
          <span className="font-display text-lg font-medium">MemberCard AI</span>
        </div>
      </header>
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 pb-20 pt-16 text-center md:pt-24">
        <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-7" />
        </div>
        <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-balance md:text-5xl">
          Create your membership card with AI
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
          Tell us a little about your card, and we&apos;ll create it for you automatically.
        </p>
        <Button asChild size="lg" className="mt-10 px-8">
          <Link href="/create">Start Creating <ArrowRight className="size-4" /></Link>
        </Button>
        <p className="mt-8 text-xs text-muted-foreground">
          Digital card in minutes · Optional physical PVC delivery in the U.S.
        </p>
      </main>
    </div>
  );
}
