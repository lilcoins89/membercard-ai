"use client";

import { MembershipCard } from "@/components/card/MembershipCard";
import type { CardDesign } from "@/lib/types";

type DashboardCard = {
  organizationName: string;
  memberName: string;
  memberNumber: string;
  membershipType: string;
  expiration: string | null;
  design: CardDesign;
};

export function DashboardCardPreview({ card }: { card: DashboardCard }) {
  return <MembershipCard model={{ organizationName: card.organizationName, memberName: card.memberName, memberNumber: card.memberNumber, membershipType: card.membershipType, expiration: card.expiration, photoUrl: null, status: "active", design: card.design }} />;
}
