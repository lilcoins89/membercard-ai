"use client";

import { useEffect, useState } from "react";
import { MembershipCard } from "@/components/card/MembershipCard";
import type { CardDraft } from "@/lib/types";

export function DashboardCardPreview() {
  const [card, setCard] = useState<CardDraft | null>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("mc_card");
      if (saved) setCard(JSON.parse(saved) as CardDraft);
    } catch {
      setCard(null);
    }
  }, []);
  return card ? <MembershipCard model={{ organizationName: card.organizationName, memberName: card.memberName, memberNumber: card.memberNumber, membershipType: card.membershipType, expiration: card.expiration, photoUrl: card.photoDataUrl, status: card.status, design: card.design }} /> : <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center"><div><p className="font-medium">Your card preview will appear here</p><p className="mt-2 text-sm text-muted-foreground">Start with the AI card creator to build your first membership card.</p></div></div>;
}
