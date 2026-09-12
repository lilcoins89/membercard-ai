export type CardDesign = {
  template: "premium" | "classic" | "modern" | "editorial";
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  logo_position: "top-left" | "top-center" | "top-right";
  photo_position: "left" | "right" | "none";
  qr_position: "left" | "right" | "bottom-right" | "back";
  fields: Array<"member_name" | "membership_type" | "member_number" | "expiration_date" | "organization">;
  show_status?: boolean;
  back_message?: string;
};

export const DEFAULT_CARD_DESIGN: CardDesign = {
  template: "premium",
  primary_color: "#0C1B2E",
  secondary_color: "#E8F0EE",
  accent_color: "#3D9A92",
  text_color: "#F4F0E8",
  logo_position: "top-left",
  photo_position: "left",
  qr_position: "right",
  fields: ["member_name", "membership_type", "member_number", "expiration_date"],
  show_status: true,
  back_message: "This card remains the property of the issuing organization.",
};

export type CardDraft = {
  organizationName: string;
  memberName: string;
  membershipType: string;
  memberNumber: string;
  expiration: string | null;
  photoDataUrl: string | null;
  design: CardDesign;
  status: "active";
};

export type ShippingAddress = {
  full_name: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
};

export type ShippingRate = {
  service: string;
  service_code: string;
  carrier: string;
  amount_cents: number;
  currency: string;
  estimated_days: number;
};
