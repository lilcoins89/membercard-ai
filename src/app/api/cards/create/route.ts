import { NextResponse } from "next/server";
import { z } from "zod";
import { createUniqueMembershipId, isValidMembershipId, saveMembershipCard } from "@/lib/membership";

const cardSchema = z.object({
  organizationName: z.string().trim().min(1).max(80),
  memberName: z.string().trim().min(1).max(80),
  membershipType: z.string().trim().min(1).max(40),
  memberNumber: z.string().trim().optional(),
  expiration: z.string().nullable(),
  photoDataUrl: z.string().nullable(),
  design: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  try {
    const parsed = cardSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Complete the card details first." }, { status: 400 });
    const input = parsed.data;
    const requestedMemberNumber = input.memberNumber?.trim().toUpperCase();
    const memberNumber = requestedMemberNumber && isValidMembershipId(requestedMemberNumber)
      ? requestedMemberNumber
      : await createUniqueMembershipId();
    const saved = await saveMembershipCard({ ...input, memberNumber });
    return NextResponse.json({ ok: true, card_id: saved.id, member_number: saved.public_membership_id });
  } catch (error) {
    console.error("[v0] card persistence failed", error);
    return NextResponse.json({ ok: false, error: "The card could not be saved. Please try again." }, { status: 500 });
  }
}
