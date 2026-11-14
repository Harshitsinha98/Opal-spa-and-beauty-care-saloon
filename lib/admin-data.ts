import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";
import { db, schema } from "./db";

export type BookingRow = Awaited<ReturnType<typeof listBookings>>[number];

export async function listBookings(f: { from?: string; to?: string; status?: string; q?: string; limit?: number; order?: "asc" | "desc" }) {
  const where: SQL[] = [];
  if (f.from) where.push(gte(schema.booking.date, f.from));
  if (f.to) where.push(lte(schema.booking.date, f.to));
  if (f.status && f.status !== "all") where.push(eq(schema.booking.status, f.status));
  if (f.q) {
    const q = `%${f.q.replace(/[%_]/g, "")}%`;
    where.push(or(ilike(schema.booking.code, q), ilike(schema.booking.customerName, q), ilike(schema.booking.phone, q), ilike(schema.booking.email, q))!);
  }
  const dir = f.order === "desc" ? desc : asc;
  const rows = await db
    .select({ b: schema.booking, staffName: schema.staff.name })
    .from(schema.booking)
    .leftJoin(schema.staff, eq(schema.booking.staffId, schema.staff.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(dir(schema.booking.date), dir(schema.booking.startMin))
    .limit(f.limit ?? 200);
  const ids = rows.map((r) => r.b.id);
  const items = ids.length ? await db.select().from(schema.bookingItem).where(inArray(schema.bookingItem.bookingId, ids)) : [];
  return rows.map((r) => ({ ...r.b, staffName: r.staffName, items: items.filter((i) => i.bookingId === r.b.id) }));
}

export async function listStaff() {
  return db.select().from(schema.staff).orderBy(desc(schema.staff.active), asc(schema.staff.name));
}

export async function listOrders(f: { status?: string; q?: string; limit?: number }) {
  const where: SQL[] = [];
  if (f.status && f.status !== "all") where.push(eq(schema.shopOrder.status, f.status));
  if (f.q) {
    const q = `%${f.q.replace(/[%_]/g, "")}%`;
    where.push(or(ilike(schema.shopOrder.code, q), ilike(schema.shopOrder.customerName, q), ilike(schema.shopOrder.phone, q))!);
  }
  const orders = await db
    .select()
    .from(schema.shopOrder)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(schema.shopOrder.createdAt))
    .limit(f.limit ?? 200);
  const ids = orders.map((o) => o.id);
  const items = ids.length ? await db.select().from(schema.shopOrderItem).where(inArray(schema.shopOrderItem.orderId, ids)) : [];
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }));
}
