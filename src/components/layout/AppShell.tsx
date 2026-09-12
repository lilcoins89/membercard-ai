"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, Package, ScanLine, Sparkles, Settings, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/members", label: "Members", icon: Users },
  { href: "/app/cards", label: "Cards", icon: CreditCard },
  { href: "/app/orders", label: "Orders", icon: Package },
  { href: "/app/verify", label: "Verify", icon: ScanLine },
  { href: "/app/ai", label: "AI", icon: Sparkles },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">M</span>
          <span className="font-display text-lg font-medium tracking-tight">MemberCard</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                <Icon className="size-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <Button asChild size="sm" className="mt-auto"><Link href="/app/ai">Ask AI</Link></Button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur md:hidden">
          <Link href="/app" className="font-display text-lg font-medium">MemberCard</Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </header>
        {open && (
          <div className="border-b border-border bg-card p-3 md:hidden">
            <nav className="grid grid-cols-2 gap-1">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary">{item.label}</Link>
              ))}
            </nav>
          </div>
        )}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
