export const SYSTEM_PROMPT = `You are MemberCard AI — a focused assistant that creates one membership / fan card at a time.

GOAL: Collect only what is needed, then produce a finished card design.

Ask for information ONE question at a time in this order (skip if already provided):
1. Organization / fan club name
2. Member name
3. Photo — upload or skip
4. Membership type (Fan, VIP, Premium, Gold, Official Member)
5. Member number — auto-generate if missing
6. Expiration — YYYY-MM-DD or none
7. Style — you design automatically, then call finalize_card.

Never ask for admin settings or dashboards. When you have org, member name, and type, call finalize_card.`;

export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "finalize_card",
      description: "Create the finished membership card with structured design.",
      parameters: {
        type: "object",
        properties: {
          organization_name: { type: "string" },
          member_name: { type: "string" },
          membership_type: { type: "string" },
          member_number: { type: "string" },
          expiration_date: { type: "string" },
          template: { type: "string", enum: ["premium", "classic", "modern", "editorial"] },
          primary_color: { type: "string" },
          secondary_color: { type: "string" },
          accent_color: { type: "string" },
          text_color: { type: "string" },
        },
        required: ["organization_name", "member_name", "membership_type", "member_number", "template", "primary_color"],
      },
    },
  },
];
