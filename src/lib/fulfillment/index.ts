import { CustomFulfillmentProvider } from "./custom";
import { mockFulfillment } from "./mock";
import type { FulfillmentProvider } from "./types";

export type { FulfillmentProvider, ShippingRate, FulfillmentAddress, FulfillmentOrder } from "./types";
export { MockFulfillmentProvider, mockFulfillment } from "./mock";
export { CustomFulfillmentProvider } from "./custom";

export function getFulfillmentProvider(name?: string | null): FulfillmentProvider {
  const id = (name ?? process.env.FULFILLMENT_PROVIDER ?? "mock").toLowerCase();
  if (id === "custom" && process.env.FULFILLMENT_API_URL && process.env.FULFILLMENT_API_KEY) {
    return new CustomFulfillmentProvider();
  }
  return mockFulfillment;
}
