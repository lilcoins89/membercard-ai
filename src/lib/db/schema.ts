import { integer, jsonb, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const shippingOrders = pgTable("shipping_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  cardId: text("card_id").notNull(),
  cardSnapshot: jsonb("card_snapshot").notNull(),
  recipientName: text("recipient_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  street: text("street").notNull(),
  unit: text("unit"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("US"),
  shippingService: text("shipping_service").notNull(),
  shippingCostCents: integer("shipping_cost_cents").notNull(),
  cardCostCents: integer("card_cost_cents").notNull(),
  fulfillmentCostCents: integer("fulfillment_cost_cents").notNull(),
  totalCostCents: integer("total_cost_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  fulfillmentStatus: text("fulfillment_status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  providerOrderId: text("provider_order_id"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shippingEvents = pgTable("shipping_events", {
  id: text("id").primaryKey(), shipmentId: text("shipment_id").notNull(), status: text("status").notNull(), message: text("message"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shippingSettings = pgTable("shipping_settings", {
  id: boolean("id").primaryKey().default(true), cardCostCents: integer("card_cost_cents").notNull().default(199), fulfillmentCostCents: integer("fulfillment_cost_cents").notNull().default(125), shippingMarkupCents: integer("shipping_markup_cents").notNull().default(0), provider: text("provider").notNull().default("mock"), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShippingOrder = typeof shippingOrders.$inferSelect;
export type NewShippingOrder = typeof shippingOrders.$inferInsert;
