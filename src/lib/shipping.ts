import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { shippingOrders, shippingEvents } from "./db/schema";

export async function getScopedUserId() {
  const value = (await headers()).get("x-user-id");
  return value?.trim() || "demo-user";
}

export async function listShipments(userId: string) {
  return db.select().from(shippingOrders).where(eq(shippingOrders.userId, userId)).orderBy(desc(shippingOrders.createdAt));
}

export async function addEvent(shipmentId: string, status: string, message?: string) {
  await db.insert(shippingEvents).values({ id: `evt_${crypto.randomUUID()}`, shipmentId, status, message });
}
