import { randomInt } from "node:crypto";
import { generateObject, generateText, gateway } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_CARD_DESIGN, type CardDesign } from "@/lib/types";

export const runtime = "nodejs";
type Msg = { role: "user" | "assistant"; content: string };

const cardSchema = z.object({
  organization_name: z.string().min(1).max(100),
  member_name: z.string().min(1).max(100),
  membership_type: z.string().min(1).max(50),
  member_number: z.string().regex(/^MC-\d{4}-\d{3}$/i).optional(),
  expiration_date: z.string().max(30).nullable(),
  template: z.enum(["premium", "modern", "classic", "editorial"]),
  primary_color: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondary_color: z.string().regex(/^#[0-9a-f]{6}$/i),
  accent_color: z.string().regex(/^#[0-9a-f]{6}$/i),
  text_color: z.string().regex(/^#[0-9a-f]{6}$/i),
});

const model = gateway("openai/gpt-5-mini");

export async function POST(req: NextRequest) {
  let messages: Msg[] = [];
  let photoDataUrl: string | null | undefined;
  try {
    const body = (await req.json()) as { messages?: Msg[]; photo_data_url?: string | null };
    messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    photoDataUrl = body.photo_data_url;
    const userCount = messages.filter((message) => message.role === "user").length;

    if (userCount < 5) {
      const result = await generateText({
        model,
        system: "You are the MemberCard AI card designer. Ask exactly one concise next question. Collect organization name, member name, photo preference, membership type, then expiration date. Do not invent details.",
        messages,
        temperature: 0.2,
      });
      return NextResponse.json({ ok: true, message: { role: "assistant", content: result.text }, card: null });
    }

    const result = await generateObject({
      model,
      schema: cardSchema,
      system: "Create a polished membership card from the conversation. Use only user-provided facts. If no expiration is requested, return null. Choose a cohesive accessible design palette.",
      messages,
      temperature: 0.2,
    });

    return NextResponse.json({
      ok: true,
      message: { role: "assistant", content: "Your card is ready. Review the preview, then save it or order a physical card." },
      card: buildCard(result.object, body.photo_data_url),
    });
  } catch (error) {
    console.error("[ai/chat]", error);
    return NextResponse.json(localCardFlow(messages, photoDataUrl));
  }
}

function localCardFlow(messages: Msg[], photo?: string | null) {
  const answers = messages.filter((message) => message.role === "user").map((message) => message.content.trim());
  const prompts = [
    "What should appear on the card as the organization or fan club name?",
    "What is the member's name?",
    "Upload a member photo, or type skip if you do not have one.",
    "What type of membership is this? Examples: Fan, VIP, Premium, Gold, Official Member.",
    "Should the card have an expiration date? Reply with a date like 2027-12-31, or type none.",
  ];
  if (answers.length < 5) return { ok: true, message: { role: "assistant", content: prompts[answers.length] }, card: null };
  return { ok: true, message: { role: "assistant", content: "AI service is temporarily unavailable, so I created your card from the details you provided." }, card: buildCard({ organization_name: answers[0] || "Membership", member_name: answers[1] || "Member", membership_type: answers[3] || "Member", expiration_date: ["none", "skip", "no"].includes((answers[4] || "none").toLowerCase()) ? null : answers[4], template: "premium", primary_color: DEFAULT_CARD_DESIGN.primary_color, secondary_color: DEFAULT_CARD_DESIGN.secondary_color, accent_color: DEFAULT_CARD_DESIGN.accent_color, text_color: DEFAULT_CARD_DESIGN.text_color }, photo) };
}

function buildCard(args: z.infer<typeof cardSchema>, photo?: string | null) {
  const design: CardDesign = {
    ...DEFAULT_CARD_DESIGN,
    template: args.template,
    primary_color: args.primary_color,
    secondary_color: args.secondary_color,
    accent_color: args.accent_color,
    text_color: args.text_color,
  };
  return {
    organizationName: args.organization_name,
    memberName: args.member_name,
    membershipType: args.membership_type,
    memberNumber: args.member_number?.toUpperCase() ?? generateNumber(),
    expiration: args.expiration_date?.toLowerCase() === "none" ? null : args.expiration_date,
    photoDataUrl: photo ?? null,
    design,
    status: "active" as const,
  };
}

function generateNumber() {
  const year = new Date().getFullYear();
  return `MC-${year}-${randomInt(100, 1000)}`;
}

