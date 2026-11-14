"use server";

import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { getSettings, availableMethods } from "@/lib/settings";
import { getCurrentUser } from "@/lib/session";
import { cancellationQuote, checkDate, expireStaleHolds, getSlots, lockDate } from "@/lib/booking";
import { makeCode } from "@/lib/codes";
import { isValidYMD } from "@/lib/time";
import { createRazorpayOrder, publicKeyId, refundPayment, verifyCheckoutSignature } from "@/lib/razorpay";
import { confirmWithGateway, recordRefund } from "@/lib/payments";

export type CheckoutPayload = {
  orderId: string;
  amount: number;
  keyId: string;
  name: string;
  email: string;
  phone: string;
  description: string;
};

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number");

async function loadServices(ids: number[]) {
  const unique = [...new Set(ids)];
  const rows = await db
    .select()
    .from(schema.service)
    .where(and(inArray(schema.service.id, unique), eq(schema.service.active, true)));
  if (rows.length !== unique.length) throw new Error("One of the selected services is no longer available.");
  return unique.map((id) => rows.find((r) => r.id === id)!);
}

export async function getSlotsAction(input: { date: string; serviceIds: number[]; staffId?: number | null }) {
  const parsed = z
    .object({
      date: z.string().refine(isValidYMD),
      serviceIds: z.array(z.number().int().positive()).min(1).max(6),
      staffId: z.number().int().positive().nullable().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid request", slots: [] };
  const s = await getSettings();
  const check = checkDate(parsed.data.date, s);
  if (!check.ok) return { ok: false as const, error: check.reason, slots: [] };
  await expireStaleHolds();
  const services = await loadServices(parsed.data.serviceIds).catch(() => null);
  if (!services) return { ok: false as const, error: "Service unavailable", slots: [] };
  const duration = services.reduce((n, x) => n + x.durationMin, 0);
  const staffId = s.booking.allowStaffSelection ? (parsed.data.staffId ?? null) : null;
  const slots = await getSlots(parsed.data.date, duration, s, { staffId });
  return { ok: true as const, slots, duration };
}

const createSchema = z.object({
  serviceIds: z.array(z.number().int().positive()).min(1).max(6),
  date: z.string().refine(isValidYMD, "Pick a date"),
  startMin: z.number().int().min(0).max(1439),
  staffId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: phoneSchema,
  email: z.email("Enter a valid email").max(120),
  notes: z.string().trim().max(500).optional(),
  method: z.enum(["online", "cash"]),
});

export async function createBookingAction(
  input: z.input<typeof createSchema>,
): Promise<Result<{ code: string; bookingId: string; checkout?: CheckoutPayload }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to book." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details" };
  const d = parsed.data;

  const s = await getSettings();
  if (!availableMethods(s).includes(d.method)) return { ok: false, error: "That payment option is not available." };
  const check = checkDate(d.date, s);
  if (!check.ok) return { ok: false, error: check.reason };

  let services;
  try {
    services = await loadServices(d.serviceIds);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const duration = services.reduce((n, x) => n + x.durationMin, 0);
  const subtotal = services.reduce((n, x) => n + x.price, 0);

  let staffId: number | null = null;
  if (s.booking.allowStaffSelection && d.staffId) {
    const st = await db.query.staff.findFirst({ where: eq(schema.staff.id, d.staffId) });
    if (!st || !st.active || !st.bookable) return { ok: false, error: "That therapist is not available." };
    staffId = st.id;
  }

  await expireStaleHolds();

  const online = d.method === "online";
  const code = makeCode("OB");
  let bookingId: string;
  try {
    bookingId = await db.transaction(async (tx) => {
      await lockDate(tx, d.date);
      const slots = await getSlots(d.date, duration, s, { staffId, tx });
      const slot = slots.find((x) => x.start === d.startMin);
      if (!slot || !slot.available) throw new Error("SLOT_TAKEN");
      const [b] = await tx
        .insert(schema.booking)
        .values({
          code,
          userId: user.id,
          customerName: d.name,
          phone: d.phone,
          email: d.email,
          date: d.date,
          startMin: d.startMin,
          endMin: d.startMin + duration,
          staffId,
          status: online ? "pending_payment" : "confirmed",
          paymentMethod: d.method,
          subtotal,
          notes: d.notes || null,
          holdExpiresAt: online ? new Date(Date.now() + s.booking.holdMinutes * 60_000) : null,
        })
        .returning({ id: schema.booking.id });
      await tx.insert(schema.bookingItem).values(
        services.map((x) => ({ bookingId: b.id, serviceId: x.id, name: x.name, price: x.price, durationMin: x.durationMin })),
      );
      return b.id;
    });
  } catch (e) {
    if ((e as Error).message === "SLOT_TAKEN") return { ok: false, error: "Someone just took that time. Please pick another slot." };
    console.error("createBooking", e);
    return { ok: false, error: "Could not create the booking. Please try again." };
  }

  // Remember the phone number for next time.
  if (!user.phone) await db.update(schema.user).set({ phone: d.phone }).where(eq(schema.user.id, user.id));

  if (!online) {
    revalidatePath("/account");
    return { ok: true, code, bookingId };
  }

  try {
    const order = await createRazorpayOrder(subtotal, code, { bookingId, kind: "booking" });
    await db.update(schema.booking).set({ razorpayOrderId: order.id }).where(eq(schema.booking.id, bookingId));
    return {
      ok: true,
      code,
      bookingId,
      checkout: {
        orderId: order.id,
        amount: subtotal,
        keyId: publicKeyId(),
        name: d.name,
        email: d.email,
        phone: d.phone,
        description: services.map((x) => x.name).join(", "),
      },
    };
  } catch (e) {
    console.error("razorpay order", e);
    await db
      .update(schema.booking)
      .set({ status: "cancelled", cancelledBy: "system", cancelReason: "Payment gateway error", cancelledAt: new Date() })
      .where(eq(schema.booking.id, bookingId));
    return { ok: false, error: "Online payment is unavailable right now. Try paying at the salon instead." };
  }
}

/** Re-opens checkout for a booking or order that is still on hold. */
export async function resumePaymentAction(kind: "booking" | "order", id: string): Promise<Result<{ checkout: CheckoutPayload }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  await expireStaleHolds();
  const table = kind === "booking" ? schema.booking : schema.shopOrder;
  const [row] = await db.select().from(table).where(and(eq(table.id, id), eq(table.userId, user.id)));
  if (!row || row.status !== "pending_payment" || !row.razorpayOrderId)
    return { ok: false, error: "This payment window has closed. Please start again." };
  const amount = "subtotal" in row ? row.subtotal : row.total;
  return {
    ok: true,
    checkout: {
      orderId: row.razorpayOrderId,
      amount,
      keyId: publicKeyId(),
      name: row.customerName,
      email: row.email,
      phone: row.phone,
      description: row.code,
    },
  };
}

export async function verifyPaymentAction(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<Result<{ kind: "booking" | "order"; code: string }>> {
  const p = z
    .object({
      razorpay_order_id: z.string().startsWith("order_").max(64),
      razorpay_payment_id: z.string().startsWith("pay_").max(64),
      razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .safeParse(input);
  if (!p.success) return { ok: false, error: "Invalid payment response." };
  const { razorpay_order_id: o, razorpay_payment_id: pay, razorpay_signature: sig } = p.data;
  if (!verifyCheckoutSignature(o, pay, sig)) return { ok: false, error: "Payment signature did not match." };
  try {
    const settled = await confirmWithGateway(o, pay);
    if (!settled) return { ok: false, error: "We could not find this booking. Please contact the salon." };
    revalidatePath("/account");
    return { ok: true, kind: settled.kind, code: settled.code };
  } catch (e) {
    console.error("verifyPayment", e);
    return { ok: false, error: "Payment received but not confirmed yet. It will update in a few minutes." };
  }
}

/** If the customer gives up on online payment, they can keep the slot and pay at the salon. */
export async function switchToCashAction(bookingId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const s = await getSettings();
  if (!s.payments.cashEnabled) return { ok: false, error: "Pay at salon is not available." };
  const res = await db
    .update(schema.booking)
    .set({ paymentMethod: "cash", status: "confirmed", holdExpiresAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(schema.booking.id, bookingId),
        eq(schema.booking.userId, user.id),
        eq(schema.booking.status, "pending_payment"),
        eq(schema.booking.paymentStatus, "unpaid"),
      ),
    )
    .returning({ id: schema.booking.id });
  if (!res.length) return { ok: false, error: "This booking can no longer be changed." };
  revalidatePath("/account");
  return { ok: true };
}

export async function cancelMyBookingAction(bookingId: string): Promise<Result<{ refund: number; fee: number }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const s = await getSettings();
  if (!s.cancellation.allowCustomerCancel)
    return { ok: false, error: "Online cancellation is turned off. Please call the salon." };

  const b = await db.query.booking.findFirst({
    where: and(eq(schema.booking.id, bookingId), eq(schema.booking.userId, user.id)),
  });
  if (!b) return { ok: false, error: "Booking not found." };
  if (b.status === "pending_payment") {
    await db
      .update(schema.booking)
      .set({ status: "cancelled", cancelledBy: "customer", cancelledAt: new Date(), cancelReason: "Cancelled before payment" })
      .where(eq(schema.booking.id, b.id));
    revalidatePath("/account");
    return { ok: true, refund: 0, fee: 0 };
  }
  if (b.status !== "confirmed") return { ok: false, error: "This booking cannot be cancelled." };

  const q = cancellationQuote(b, s);
  if (q.started) return { ok: false, error: "This appointment has already started." };

  let refundId: string | undefined;
  let refundStatus = "success";
  if (q.refund > 0 && b.paymentMethod === "online" && b.razorpayPaymentId) {
    try {
      const r = await refundPayment(b.razorpayPaymentId, q.refund, { booking: b.code, reason: "customer cancellation" });
      refundId = r.id;
      refundStatus = r.status === "processed" ? "success" : "pending";
    } catch (e) {
      console.error("refund", e);
      return { ok: false, error: "We couldn't start your refund. Please call the salon and we'll sort it out." };
    }
  }

  await db.transaction(async (tx) => {
    const refundTotal = b.refundAmount + (refundId ? q.refund : 0);
    await tx
      .update(schema.booking)
      .set({
        status: "cancelled",
        cancelledBy: "customer",
        cancelledAt: new Date(),
        cancelReason: "Cancelled by customer",
        cancellationFee: b.paymentStatus === "paid" ? q.fee : 0,
        refundAmount: refundTotal,
        paymentStatus:
          refundTotal === 0 ? b.paymentStatus : refundTotal >= b.amountPaid ? "refunded" : "partially_refunded",
        updatedAt: new Date(),
      })
      .where(eq(schema.booking.id, b.id));
    if (refundId)
      await recordRefund(tx, {
        kind: "booking",
        refId: b.id,
        refCode: b.code,
        amount: q.refund,
        method: "razorpay",
        razorpayId: refundId,
        status: refundStatus,
        note: q.fee ? `Cancellation fee kept: ${q.fee / 100}` : "Full refund",
      });
  });
  revalidatePath("/account");
  return { ok: true, refund: refundId ? q.refund : 0, fee: b.paymentStatus === "paid" ? q.fee : 0 };
}
