import type { CardDesign } from "@/lib/types";

export type FulfillmentProduct = {
  sku: string; name: string; description: string; unit_cents: number; currency: string;
};
export type FulfillmentAddress = {
  full_name: string; street: string; unit?: string | null; city: string;
  state: string; zip: string; country: string; phone?: string | null;
};
export type ShippingRate = {
  service: string; service_code: string; carrier: string;
  amount_cents: number; currency: string; estimated_days: number;
};
export type ArtworkPayload = {
  card_id: string; member_name: string; member_number: string | null;
  membership_type: string | null; expiration_date: string | null;
  organization_name: string; design: CardDesign;
};
export type CreateFulfillmentOrderInput = {
  idempotency_key: string; product_sku: string; quantity: number;
  shipping: ShippingRate; address: FulfillmentAddress; artwork: ArtworkPayload;
};
export type FulfillmentOrder = {
  id: string;
  status: "created" | "submitted" | "in_production" | "shipped" | "delivered" | "cancelled" | "failed";
  tracking_number?: string | null; tracking_url?: string | null; carrier?: string | null;
  estimated_delivery?: string | null; shipped_at?: string | null; delivered_at?: string | null;
};
export interface FulfillmentProvider {
  id: string;
  getProducts(): Promise<FulfillmentProduct[]>;
  getShippingRates(address: FulfillmentAddress): Promise<ShippingRate[]>;
  createOrder(input: CreateFulfillmentOrderInput): Promise<FulfillmentOrder>;
  submitOrder(id: string): Promise<FulfillmentOrder>;
  getOrder(id: string): Promise<FulfillmentOrder>;
  getTracking(id: string): Promise<FulfillmentOrder>;
  cancelOrder(id: string): Promise<FulfillmentOrder>;
}
