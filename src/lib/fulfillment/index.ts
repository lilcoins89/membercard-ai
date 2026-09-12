import { CustomFulfillmentProvider } from "./custom";
import { MockFulfillmentProvider } from "./mock";
import type { FulfillmentProvider } from "./types";

export type { FulfillmentProvider, ShippingRate, FulfillmentAddress, FulfillmentOrder } from "./types";
export { CustomFulfillmentProvider } from "./custom";
export { MockFulfillmentProvider } from "./mock";

export function getFulfillmentProvider(name?: string | null): FulfillmentProvider {
  const preferred = (name ?? process.env.FULFILLMENT_PROVIDER ?? "custom").toLowerCase();
  if (preferred === "mock") {
    if (process.env.NODE_ENV !== "production" && process.env.FULFILLMENT_TEST_MODE === "true") return new MockFulfillmentProvider();
    throw new Error("mock_provider_disabled");
  }
  if (preferred === "custom" && process.env.FULFILLMENT_API_URL && process.env.FULFILLMENT_API_KEY) return new CustomFulfillmentProvider();
  throw new Error("provider_not_configured");
}
