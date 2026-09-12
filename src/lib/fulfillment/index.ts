import { CustomFulfillmentProvider } from "./custom";
import { MockFulfillmentProvider } from "./mock";
import type { FulfillmentProvider } from "./types";

export type { FulfillmentProvider, ShippingRate, FulfillmentAddress, FulfillmentOrder } from "./types";
export { CustomFulfillmentProvider } from "./custom";
export { MockFulfillmentProvider } from "./mock";

/** Prefer custom PVC provider when credentials exist. */
export function getFulfillmentProvider(name?: string | null): FulfillmentProvider {
  const preferred = (name ?? process.env.FULFILLMENT_PROVIDER ?? "custom").toLowerCase();
  const hasCustom = !!process.env.FULFILLMENT_API_URL && !!process.env.FULFILLMENT_API_KEY;
  if (preferred === "custom" && hasCustom) return new CustomFulfillmentProvider();
  if (preferred === "custom" && !hasCustom) {
    console.warn("[fulfillment] Custom PVC selected but credentials missing — using development rates.");
  }
  return new MockFulfillmentProvider();
}
