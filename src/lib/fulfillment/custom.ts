import type {
  CreateFulfillmentOrderInput, FulfillmentOrder, FulfillmentProduct,
  FulfillmentProvider, ShippingRate,
} from "./types";

/** Production PVC provider — credentials only in FULFILLMENT_API_URL / FULFILLMENT_API_KEY. */
export class CustomFulfillmentProvider implements FulfillmentProvider {
  id = "custom";
  private get base() {
    const url = process.env.FULFILLMENT_API_URL;
    const key = process.env.FULFILLMENT_API_KEY;
    if (!url || !key) throw new Error("Fulfillment provider is not configured.");
    return { url: url.replace(/\/$/, ""), key };
  }
  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const { url, key } = this.base;
    const res = await fetch(`${url}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error("We couldn't reach the print partner right now.");
    return (await res.json()) as T;
  }
  getProducts() { return this.req<FulfillmentProduct[]>("/products"); }
  getShippingRates(address: CreateFulfillmentOrderInput["address"]) {
    return this.req<ShippingRate[]>("/shipping/rates", { method: "POST", body: JSON.stringify({ address }) });
  }
  createOrder(input: CreateFulfillmentOrderInput) {
    return this.req<FulfillmentOrder>("/orders", {
      method: "POST", body: JSON.stringify(input),
      headers: { "Idempotency-Key": input.idempotency_key },
    });
  }
  submitOrder(id: string) { return this.req<FulfillmentOrder>(`/orders/${id}/submit`, { method: "POST" }); }
  getOrder(id: string) { return this.req<FulfillmentOrder>(`/orders/${id}`); }
  getTracking(id: string) { return this.req<FulfillmentOrder>(`/orders/${id}/tracking`); }
  cancelOrder(id: string) { return this.req<FulfillmentOrder>(`/orders/${id}/cancel`, { method: "POST" }); }
}
