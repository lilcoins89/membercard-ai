export type Role = "owner" | "admin" | "membership_manager" | "verifier" | "viewer";
export type MemberStatus = "active" | "suspended" | "expired" | "revoked";
export type CardStatus = "draft" | "issued" | "revoked" | "expired";
export type OrderStatus =
  | "DRAFT" | "PAYMENT_PENDING" | "PAID" | "ARTWORK_READY"
  | "SUBMITTED_TO_FULFILLMENT" | "IN_PRODUCTION" | "SHIPPED" | "DELIVERED"
  | "FAILED" | "CANCELLED" | "REFUNDED";
export type ShippingPayer = "customer" | "organization" | "included";

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

export type Organization = {
  id: string;
  owner_user_id: string;
  name: string;
  logo_url: string | null;
  brand_primary: string;
  brand_secondary: string;
  brand_accent: string;
  onboarded: boolean;
  card_price_cents: number;
  shipping_payer: ShippingPayer;
  fulfillment_provider: string;
  created_at: string;
};

export type Member = {
  id: string;
  organization_id: string;
  full_name: string;
  email: string | null;
  member_number: string | null;
  membership_type_name: string | null;
  expiration_date: string | null;
  status: MemberStatus;
  photo_url: string | null;
  created_at: string;
};
