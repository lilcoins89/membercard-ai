import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shippingOrders, shippingEvents } from "@/lib/db/schema";
import { getScopedUserId } from "@/lib/shipping";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getScopedUserId();
  const { id } = await params;
  const [shipment] = await db.select().from(shippingOrders).where(and(eq(shippingOrders.id, id), eq(shippingOrders.userId, userId))).limit(1);
  if (!shipment) return NextResponse.json({ ok: false, error: "Shipment not found" }, { status: 404 });
  const events = await db.select().from(shippingEvents).where(eq(shippingEvents.shipmentId, id));
  return NextResponse.json({ ok: true, shipment, events });
}
