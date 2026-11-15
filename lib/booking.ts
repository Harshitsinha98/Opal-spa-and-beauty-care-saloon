import "server-only";
import { and, eq, gt, inArray, lt, ne, or, sql } from "drizzle-orm";
import { db, schema, type DbOrTx } from "./db";
import type { Settings } from "./settings";
import { hhmmToMinutes } from "./format";
import { addDays, istToDate, nowIST, weekday } from "./time";

export const BLOCKING_STATUSES = ["confirmed", "completed"] as const;

export type Slot = { start: number; end: number; available: boolean; left: number };

type DateCheck = { ok: true } | { ok: false; reason: string };

export function checkDate(date: string, s: Settings): DateCheck {
  const today = nowIST().ymd;
  if (date < today) return { ok: false, reason: "That date has passed." };
  if (date > addDays(today, s.booking.advanceDays))
    return { ok: false, reason: `Bookings open ${s.booking.advanceDays} days ahead.` };
  if (s.hours.closedWeekdays.includes(weekday(date))) return { ok: false, reason: "The salon is closed on this day." };
  if (s.hours.closedDates.includes(date)) return { ok: false, reason: "The salon is closed on this date." };
  return { ok: true };
}

/** Bookings that currently occupy time on `date` (confirmed, completed, or an unexpired payment hold). */
async function occupying(date: string, excludeId?: string, tx: DbOrTx = db) {
  const now = new Date();
  const rows = await tx
    .select({
      id: schema.booking.id,
      startMin: schema.booking.startMin,
      endMin: schema.booking.endMin,
      staffId: schema.booking.staffId,
    })
    .from(schema.booking)
    .where(
      and(
        eq(schema.booking.date, date),
        excludeId ? ne(schema.booking.id, excludeId) : undefined,
        or(
          inArray(schema.booking.status, [...BLOCKING_STATUSES]),
          and(eq(schema.booking.status, "pending_payment"), gt(schema.booking.holdExpiresAt, now)),
        ),
      ),
    );
  return rows;
}

export async function getSlots(
  date: string,
  durationMin: number,
  s: Settings,
  opts: { staffId?: number | null; excludeBookingId?: string; ignoreLead?: boolean; tx?: DbOrTx } = {},
): Promise<Slot[]> {
  const check = checkDate(date, s);
  if (!check.ok) return [];
  const open = hhmmToMinutes(s.hours.open);
  const close = hhmmToMinutes(s.hours.close);
  const step = s.booking.slotIntervalMin;
  const now = nowIST();
  const earliest = date === now.ymd && !opts.ignoreLead ? now.minutes + s.booking.minLeadMinutes : -1;
  const taken = await occupying(date, opts.excludeBookingId, opts.tx);
  const cap = s.booking.capacityPerSlot;

  const slots: Slot[] = [];
  for (let start = open; start + durationMin <= close; start += step) {
    const end = start + durationMin;
    if (start < earliest) continue;
    const overlapping = taken.filter((b) => b.startMin < end && b.endMin > start);
    let left = cap - overlapping.length;
    if (opts.staffId && overlapping.some((b) => b.staffId === opts.staffId)) left = 0;
    slots.push({ start, end, available: left > 0, left: Math.max(0, left) });
  }
  return slots;
}

/** Postgres advisory lock, held until the transaction ends, so two people can't grab the last seat at once. */
export async function lockDate(tx: DbOrTx, date: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"opal-booking:" + date}))`);
}

export function cancellationQuote(
  b: Pick<schema.Booking, "date" | "startMin" | "amountPaid" | "refundAmount">,
  s: Settings,
  now = new Date(),
) {
  const start = istToDate(b.date, b.startMin);
  const hoursLeft = (start.getTime() - now.getTime()) / 3_600_000;
  const free = hoursLeft >= s.cancellation.freeWindowHours;
  const refundable = Math.max(0, b.amountPaid - b.refundAmount);
  let fee = 0;
  if (!free) {
    fee =
      s.cancellation.feeType === "percent"
        ? Math.round((refundable * Math.min(100, s.cancellation.feeValue)) / 100)
        : Math.min(refundable, Math.round(s.cancellation.feeValue * 100));
  }
  return { free, hoursLeft, fee, refund: Math.max(0, refundable - fee), started: hoursLeft <= 0 };
}

/**
 * Lazily releases payment holds that were never paid: bookings go to "cancelled",
 * shop orders go to "cancelled" and give their stock back. Called before any
 * availability/stock-sensitive operation and from admin pages.
 */
export async function expireStaleHolds() {
  const now = new Date();
  await db
    .update(schema.booking)
    .set({ status: "cancelled", cancelledBy: "system", cancelReason: "Payment not completed", cancelledAt: now, updatedAt: now })
    .where(and(eq(schema.booking.status, "pending_payment"), lt(schema.booking.holdExpiresAt, now)));

  await db.transaction(async (tx) => {
    const stale = await tx
      .update(schema.shopOrder)
      .set({ status: "cancelled", cancelReason: "Payment not completed", cancelledAt: now, updatedAt: now, stockRestored: true })
      .where(
        and(
          eq(schema.shopOrder.status, "pending_payment"),
          lt(schema.shopOrder.holdExpiresAt, now),
          eq(schema.shopOrder.stockRestored, false),
        ),
      )
      .returning({ id: schema.shopOrder.id });
    if (stale.length) await restoreStock(tx, stale.map((o) => o.id));
  });
}

export async function restoreStock(tx: DbOrTx, orderIds: string[]) {
  const items = await tx.select().from(schema.shopOrderItem).where(inArray(schema.shopOrderItem.orderId, orderIds));
  for (const it of items) {
    if (!it.productId) continue;
    await tx
      .update(schema.product)
      .set({ stock: sql`${schema.product.stock} + ${it.qty}` })
      .where(eq(schema.product.id, it.productId));
  }
}

/** Whether a customer may move this booking themselves, and if not, why. */
export function rescheduleCheck(
  b: Pick<schema.Booking, "date" | "startMin" | "status" | "rescheduleCount">,
  s: Settings,
  now = new Date(),
): { ok: true; left: number } | { ok: false; reason: string } {
  const r = s.reschedule;
  if (!r.allowCustomer) return { ok: false, reason: "Online rescheduling is off. Please call the salon." };
  if (b.status !== "confirmed") return { ok: false, reason: "Only confirmed bookings can be moved." };
  const hoursLeft = (istToDate(b.date, b.startMin).getTime() - now.getTime()) / 3_600_000;
  if (hoursLeft < r.cutoffHours)
    return { ok: false, reason: r.cutoffHours > 0 ? `Changes close ${r.cutoffHours} hours before your visit. Please call the salon.` : "This visit has started." };
  if (b.rescheduleCount >= r.maxPerBooking)
    return { ok: false, reason: `This booking has already been moved ${r.maxPerBooking} time${r.maxPerBooking > 1 ? "s" : ""}. Please call the salon.` };
  return { ok: true, left: r.maxPerBooking - b.rescheduleCount };
}
