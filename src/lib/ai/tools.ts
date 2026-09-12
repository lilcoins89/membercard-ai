export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "update_organization",
      description: "Set organization name, logo, branding, or mark onboarding complete.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          logo_url: { type: "string" },
          brand_primary: { type: "string" },
          mark_onboarded: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "set_card_design",
      description: "Set structured membership card design JSON (never a flat image).",
      parameters: {
        type: "object",
        properties: {
          template: { type: "string", enum: ["premium", "classic", "modern", "editorial"] },
          primary_color: { type: "string" },
          secondary_color: { type: "string" },
          accent_color: { type: "string" },
        },
        required: ["template", "primary_color"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_member",
      description: "Create a member and optionally issue a digital membership card.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          email: { type: "string" },
          member_number: { type: "string" },
          membership_type_name: { type: "string" },
          expiration_date: { type: "string" },
          issue_card: { type: "boolean" },
        },
        required: ["full_name"],
      },
    },
  },
];

export const SYSTEM_PROMPT = `You are MemberCard AI. Create membership programs and cards via tools.
Ask only for missing information. Prefer action over long explanations.
Never generate a flat card image — use set_card_design for structured JSON.
For destructive actions, require confirmation first.`;
