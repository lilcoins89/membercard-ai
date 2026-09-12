import { NextRequest, NextResponse } from "next/server";
import { AI_TOOLS, SYSTEM_PROMPT } from "@/lib/ai/tools";
import { DEFAULT_CARD_DESIGN, type CardDesign } from "@/lib/types";

export const runtime = "nodejs";
type Msg = { role: string; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { messages: Msg[]; photo_data_url?: string | null };
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json(localCardFlow(body.messages, body.photo_data_url));

    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey });
    const messages: Array<{ role: string; content: string | null; tool_call_id?: string; tool_calls?: unknown[] }> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...body.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    for (let round = 0; round < 4; round++) {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages as never,
        tools: AI_TOOLS as never,
        tool_choice: "auto",
        max_tokens: 1000,
        temperature: 0.35,
      });
      const msg = completion.choices[0]?.message;
      if (!msg) break;
      if (msg.tool_calls?.length) {
        messages.push({ role: "assistant", content: msg.content, tool_calls: msg.tool_calls });
        for (const call of msg.tool_calls) {
          if (call.function.name === "finalize_card") {
            const card = buildCardFromArgs(call.function.arguments, body.photo_data_url);
            return NextResponse.json({
              ok: true,
              message: { role: "assistant", content: "Your card is ready. Review the preview — save, share, or order a physical PVC card." },
              card,
            });
          }
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ ok: true }) });
        }
        continue;
      }
      return NextResponse.json({ ok: true, message: { role: "assistant", content: msg.content ?? "" }, card: null });
    }
    return NextResponse.json({ ok: true, message: { role: "assistant", content: "Tell me a bit more so I can finish your card." }, card: null });
  } catch (err) {
    console.error("[ai/chat]", err);
    return NextResponse.json({ ok: false, error: "The AI assistant is temporarily unavailable." }, { status: 500 });
  }
}

function generateNumber(org: string): string {
  const initials = org.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return `${initials || "MC"}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildCardFromArgs(argsJson: string, photo?: string | null) {
  let args: Record<string, string> = {};
  try { args = JSON.parse(argsJson); } catch { args = {}; }
  const design: CardDesign = {
    ...DEFAULT_CARD_DESIGN,
    template: (args.template as CardDesign["template"]) || "premium",
    primary_color: args.primary_color || DEFAULT_CARD_DESIGN.primary_color,
    secondary_color: args.secondary_color || DEFAULT_CARD_DESIGN.secondary_color,
    accent_color: args.accent_color || DEFAULT_CARD_DESIGN.accent_color,
    text_color: args.text_color || DEFAULT_CARD_DESIGN.text_color,
  };
  const exp = (args.expiration_date || "").trim();
  return {
    organizationName: args.organization_name || "Membership",
    memberName: args.member_name || "Member",
    membershipType: args.membership_type || "Member",
    memberNumber: args.member_number || generateNumber(args.organization_name || "MC"),
    expiration: exp && exp.toLowerCase() !== "none" ? exp : null,
    photoDataUrl: photo || null,
    design,
    status: "active" as const,
  };
}

function localCardFlow(messages: Msg[], photo?: string | null) {
  const userTexts = messages.filter((m) => m.role === "user").map((m) => m.content.trim());
  const n = userTexts.length;
  if (n === 0) return { ok: true, message: { role: "assistant", content: "What should appear on the card as the organization or fan club name?" }, card: null };
  if (n === 1) return { ok: true, message: { role: "assistant", content: "What's the member's name?" }, card: null };
  if (n === 2) return { ok: true, message: { role: "assistant", content: "Upload a member photo, or type skip if you don't have one." }, card: null };
  if (n === 3) return { ok: true, message: { role: "assistant", content: "What type of membership is this? Examples: Fan, VIP, Premium, Gold, Official Member." }, card: null };
  if (n === 4) return { ok: true, message: { role: "assistant", content: "Should the card have an expiration date? Reply with a date like 2027-12-31, or type none." }, card: null };

  const org = userTexts[0] || "Membership";
  const member = userTexts[1] || "Member";
  const photoAnswer = userTexts[2]?.toLowerCase() || "skip";
  const type = userTexts[3] || "Member";
  const expRaw = (userTexts[4] || "none").toLowerCase();
  const expiration = expRaw === "none" || expRaw === "skip" || expRaw === "no" ? null : userTexts[4]!;
  const lower = `${org} ${type}`.toLowerCase();
  let design: CardDesign = { ...DEFAULT_CARD_DESIGN };
  if (lower.includes("fan") || lower.includes("vip")) {
    design = { ...design, template: "modern", primary_color: "#1B3A2F", accent_color: "#E8C547", text_color: "#F4F0E8" };
  } else if (lower.includes("association") || lower.includes("club")) {
    design = { ...design, template: "classic", primary_color: "#1A2B4A", secondary_color: "#F3EEE4", accent_color: "#8B7355", text_color: "#1A2B4A" };
  }
  return {
    ok: true,
    message: { role: "assistant", content: "I'll create a premium design based on your information. Your card is ready." },
    card: {
      organizationName: org,
      memberName: member,
      membershipType: type,
      memberNumber: generateNumber(org),
      expiration,
      photoDataUrl: photo && !photoAnswer.includes("skip") ? photo : null,
      design,
      status: "active" as const,
    },
  };
}
