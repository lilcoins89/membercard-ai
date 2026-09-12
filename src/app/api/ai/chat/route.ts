import { NextRequest, NextResponse } from "next/server";
import { AI_TOOLS, SYSTEM_PROMPT } from "@/lib/ai/tools";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { messages: { role: string; content: string }[] };
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json(demoReply(body.messages));

    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey });
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...body.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools: AI_TOOLS as never,
      tool_choice: "auto",
      max_tokens: 1200,
      temperature: 0.4,
    });
    const msg = completion.choices[0]?.message;
    return NextResponse.json({
      ok: true,
      message: { role: "assistant", content: msg?.content ?? "Done." },
    });
  } catch (err) {
    console.error("[ai/chat]", err);
    return NextResponse.json(
      { ok: false, error: "The AI assistant is temporarily unavailable." },
      { status: 500 },
    );
  }
}

function demoReply(messages: { role: string; content: string }[]) {
  const last = messages[messages.length - 1]?.content?.toLowerCase() ?? "";
  let content =
    "Welcome. I'll create your membership program with you. What is the name of your organization?";
  if (last.includes("fitness") || last.includes("club") || last.includes("royal")) {
    content = "Great — Royal Fitness Club. What membership types do you offer? (For example: Basic and Premium.)";
  } else if (last.includes("premium") || last.includes("basic")) {
    content = "Perfect. I'll use a premium dark card design with teal accents. Who should receive the first card?";
  } else if (last.includes("sarah") || last.includes("member") || last.includes("rf-")) {
    content = "Done. Sarah Johnson's Premium membership card (RF-4582, expires December 31, 2027) is ready.";
  }
  return { ok: true, demo: true, message: { role: "assistant", content } };
}
