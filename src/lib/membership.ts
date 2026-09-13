import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const MEMBERSHIP_ID_PATTERN = /^MC-\d{4}-\d{3}$/;

export function isValidMembershipId(value: string) {
  return MEMBERSHIP_ID_PATTERN.test(value.trim().toUpperCase());
}

export async function createUniqueMembershipId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const year = new Date().getFullYear();
    const suffix = Math.floor(100 + Math.random() * 900);
    const candidate = `MC-${year}-${suffix}`;
    const result = await db.execute(sql`SELECT 1 FROM public.membership_cards WHERE public_membership_id = ${candidate} LIMIT 1`);
    if (result.rows.length === 0) return candidate;
  }
  throw new Error("Could not allocate a unique membership ID");
}

function normalizeExpiration(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export async function saveMembershipCard(card: {
  organizationName: string;
  memberName: string;
  membershipType: string;
  memberNumber: string;
  expiration: string | null;
  photoDataUrl: string | null;
  design: unknown;
}) {
  if (!isValidMembershipId(card.memberNumber)) throw new Error("Invalid membership ID");
  const expiration = normalizeExpiration(card.expiration);
  const result = await db.execute(sql`
    INSERT INTO public.membership_cards (public_membership_id, organization_name, member_name, membership_type, expiration_date, photo_data_url, design)
    VALUES (${card.memberNumber}, ${card.organizationName}, ${card.memberName}, ${card.membershipType}, ${expiration}, ${card.photoDataUrl}, ${JSON.stringify(card.design)}::jsonb)
    ON CONFLICT (public_membership_id) DO UPDATE SET organization_name = EXCLUDED.organization_name, member_name = EXCLUDED.member_name, membership_type = EXCLUDED.membership_type, expiration_date = EXCLUDED.expiration_date, photo_data_url = EXCLUDED.photo_data_url, design = EXCLUDED.design, updated_at = now()
    RETURNING id, public_membership_id
  `);
  return result.rows[0] as { id: string; public_membership_id: string };
}
