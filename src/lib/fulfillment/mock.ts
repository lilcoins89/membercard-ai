import type {
  CreateFulfillmentOrderInput, FulfillmentOrder, FulfillmentProduct,
  FulfillmentProvider, ShippingRate,
} from "./types";

const PRODUCTS: FulfillmentProduct[] = [{
  sku: "pvc-cr80-color",
  name: "CR80 PVC membership card",
  description: "Credit-card sized full-color PVC card, front and back print.",
  unit_cents: 125,
  currency: "usd",
}];

type Stored = FulfillmentOrder & { input: CreateFulfillmentOrderInput };
const g = globalThis as typeof globalThis & { __mcFulfillmentStore__?: Map<string, Stored> };
function store() { g.__mcFulfillmentStore__ ??= new Map(); return g.__mcFulfillmentStore__; }
function zipZone(zip: string): number {
  const d = Number(zip.replace(/\D/g, "")[0] ?? 4);
  return Number.isFinite(d) ? d : 4;
}
function publicOrder(row: Stored): FulfillmentOrder {
  const { input: _i, ...rest } = row;
  return rest;
}

/** Development rates when custom PVC credentials are not set. */
export class MockFulfillmentProvider implements FulfillmentProvider {
  id = "mock";
  async getProducts() { return PRODUCTS; }
  async getShippingRates(address: { zip: string }): Promise<ShippingRate[]> {
    const distance = Math.abs(zipZone(address.zip) - 4);
    return [
      { service: "Standard", service_code: "usps_ground", carrier: "USPS", amount_cents: 249 + distance * 42, currency: "usd", estimated_days: 5 + Math.min(distance, 3) },
      { service: "Expedited", service_code: "usps_priority", carrier: "USPS", amount_cents: 689 + distance * 68, currency: "usd", estimated_days: 2 },
      { service: "Overnight", service_code: "usps_express", carrier: "USPS", amount_cents: 1849 + distance * 95, currency: "usd", estimated_days: 1 },
    ];
  }
  async createOrder(input: CreateFulfillmentOrderInput): Promise<FulfillmentOrder> {
    const existing = [...store().values()].find((o) => o.input.idempotency_key === input.idempotency_key);
    if (existing) return publicOrder(existing);
    const id = `ff_${crypto.randomUUID()}`;
    const row: Stored = { id, status: "created", input };
    store().set(id, row);
    return publicOrder(row);
  }
  async submitOrder(id: string): Promise<FulfillmentOrder> {
    const row = store().get(id);
    if (!row) throw new Error("Fulfillment order not found");
    if (row.status === "created") row.status = "submitted";
    if (row.status === "submitted") row.status = "in_production";
    return publicOrder(row);
  }
  async getOrder(id: string) {
    const row = store().get(id);
    if (!row) throw new Error("Fulfillment order not found");
    return publicOrder(row);
  }
  async getTracking(id: string) { return this.getOrder(id); }
  async cancelOrder(id: string) {
    const row = store().get(id);
    if (!row) throw new Error("Fulfillment order not found");
    if (row.status === "shipped" || row.status === "delivered") throw new Error("Already shipped");
    row.status = "cancelled";
    return publicOrder(row);
  }
}
