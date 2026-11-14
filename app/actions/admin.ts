"use server";

import { z } from "zod";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db, schema } from "@/lib/db";
import { assertRole } from "@/lib/session";
import { getSettings, saveSettings, settingsSchema, type Settings } from "@/lib/settings";
import { cancellationQuote, getSlots, lockDate, restoreStock } from "@/lib/booking";
import { refundPayment } from "@/lib/razorpay";
import { recordRefund } from "@/lib/payments";
import { slugify } from "@/lib/format";
import { isValidYMD } from "@/lib/time";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function fail(e: unknown): { ok: false; error: string } {
  const msg = e instanceof z.ZodError ? (e.issues[0]?.message ?? "Invalid input") : (e as Error).message;
  return { ok: false, error: msg || "Something went wrong" };
}

function refreshPublic() {
  revalidatePath("/", "layout");
}

const rupeesToPaise = z.coerce
  .number()
  .min(0, "Price can't be negative")
  .max(10_00_000)
  .transform((r) => Math.round(r * 100));

/* ------------------------------- Settings ------------------------------- */

export async function saveSettingsAction(value: Settings): Promise<Result> {
  try {
    await assertRole(["admin"]);
    const clean = settingsSchema.parse(value);
    if (clean.hours.open >= clean.hours.close) throw new Error("Closing time must be after opening time.");
    if (clean.cancellation.feeType === "percent" && clean.cancellation.feeValue > 100)
      throw new Error("Percentage fee can't exceed 100.");
    await saveSettings(clean);
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------- Services ------------------------------- */

const categoryInput = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(60),
  blurb: z.string().trim().max(200).optional(),
  sort: z.coerce.number().int().default(0),
});

export async function saveCategoryAction(input: z.input<typeof categoryInput>): Promise<Result> {
  try {
    await assertRole(["admin"]);
    const d = categoryInput.parse(input);
    const values = { name: d.name, blurb: d.blurb || null, sort: d.sort, slug: slugify(d.name) };
    if (d.id) await db.update(schema.serviceCategory).set(values).where(eq(schema.serviceCategory.id, d.id));
    else await db.insert(schema.serviceCategory).values(values);
    refreshPublic();
    return { ok: true };
  } catch (e) {
    if (String(e).includes("unique")) return { ok: false, error: "A category with this name already exists." };
    return fail(e);
  }
}

export async function deleteCategoryAction(id: number): Promise<Result> {
  try {
    await assertRole(["admin"]);
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.service)
      .where(eq(schema.service.categoryId, id));
    if (n > 0) throw new Error("Move or delete the services in this category first.");
    await db.delete(schema.serviceCategory).where(eq(schema.serviceCategory.id, id));
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const serviceInput = z.object({
  id: z.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive("Choose a category"),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(600).default(""),
  durationMin: z.coerce.number().int().min(5).max(480),
  price: rupeesToPaise,
  image: z.string().trim().max(500).optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sort: z.coerce.number().int().default(0),
});

export async function saveServiceAction(input: z.input<typeof serviceInput>): Promise<Result> {
  try {
    await assertRole(["admin"]);
    const d = serviceInput.parse(input);
    const values = {
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      durationMin: d.durationMin,
      price: d.price,
      image: d.image || null,
      featured: d.featured,
      active: d.active,
      sort: d.sort,
    };
    if (d.id) {
      await db.update(schema.service).set(values).where(eq(schema.service.id, d.id));
    } else {
      let slug = slugify(d.name);
      const clash = await db.query.service.findFirst({ where: eq(schema.service.slug, slug) });
      if (clash) slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
      await db.insert(schema.service).values({ ...values, slug });
    }
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteServiceAction(id: number): Promise<Result> {
  try {
    await assertRole(["admin"]);
    // Past bookings keep a copy of the name and price, so deleting is safe.
    await db.delete(schema.service).where(eq(schema.service.id, id));
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------- Products ------------------------------- */

const productInput = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(80),
  brand: z.string().trim().max(60).optional(),
  description: z.string().trim().max(800).default(""),
  size: z.string().trim().max(40).optional(),
  price: rupeesToPaise,
  stock: z.coerce.number().int().min(0).max(100000),
  image: z.string().trim().max(500).optional(),
  tone: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#C9A79C"),
  active: z.boolean().default(true),
  sort: z.coerce.number().int().default(0),
});

export async function saveProductAction(input: z.input<typeof productInput>): Promise<Result> {
  try {
    await assertRole(["admin"]);
    const d = productInput.parse(input);
    const values = {
      name: d.name,
      brand: d.brand || null,
      description: d.description,
      size: d.size || null,
      price: d.price,
      stock: d.stock,
      image: d.image || null,
      tone: d.tone,
      active: d.active,
      sort: d.sort,
    };
    if (d.id) await db.update(schema.product).set(values).where(eq(schema.product.id, d.id));
    else {
      let slug = slugify(d.name);
      const clash = await db.query.product.findFirst({ where: eq(schema.product.slug, slug) });
      if (clash) slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
      await db.insert(schema.product).values({ ...values, slug });
    }
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProductAction(id: number): Promise<Result> {
  try {
    await assertRole(["admin"]);
    await db.delete(schema.product).where(eq(schema.product.id, id));
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* --------------------------------- Staff -------------------------------- */

const staffInput = z.object({
  name: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(60),
  email: z.email().max(120).transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function createStaffAction(input: z.input<typeof staffInput>): Promise<Result> {
  try {
    await assertRole(["admin"]);
    const d = staffInput.parse(input);
    const existing = await db.query.user.findFirst({ where: eq(schema.user.email, d.email) });
    if (existing && existing.role === "admin") throw new Error("That email belongs to an admin.");
    const hash = await hashPassword(d.password);
    await db.transaction(async (tx) => {
      let userId = existing?.id;
      if (!userId) {
        userId = crypto.randomUUID();
        await tx.insert(schema.user).values({ id: userId, name: d.name, email: d.email, emailVerified: true, role: "staff" });
      } else {
        await tx.update(schema.user).set({ role: "staff", name: d.name }).where(eq(schema.user.id, userId));
      }
      const cred = await tx.query.account.findFirst({
        where: and(eq(schema.account.userId, userId), eq(schema.account.providerId, "credential")),
      });
      if (cred) await tx.update(schema.account).set({ password: hash }).where(eq(schema.account.id, cred.id));
      else
        await tx.insert(schema.account).values({
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: hash,
        });
      const st = await tx.query.staff.findFirst({ where: eq(schema.staff.userId, userId) });
      if (st) await tx.update(schema.staff).set({ name: d.name, title: d.title, active: true }).where(eq(schema.staff.id, st.id));
      else await tx.insert(schema.staff).values({ userId, name: d.name, title: d.title });
    });
    revalidatePath("/admin/staff");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateStaffAction(input: {
  id: number;
  name: string;
  title: string;
  active: boolean;
  bookable: boolean;
}): Promise<Result> {
  try {
    await assertRole(["admin"]);
    const d = z
      .object({
        id: z.number().int().positive(),
        name: z.string().trim().min(2).max(80),
        title: z.string().trim().min(2).max(60),
        active: z.boolean(),
        bookable: z.boolean(),
      })
      .parse(input);
    const st = await db.query.staff.findFirst({ where: eq(schema.staff.id, d.id) });
    if (!st) throw new Error("Staff member not found");
    await db.transaction(async (tx) => {
      await tx
        .update(schema.staff)
        .set({ name: d.name, title: d.title, active: d.active, bookable: d.bookable })
        .where(eq(schema.staff.id, d.id));
      if (st.userId) {
        // Deactivating removes panel access and signs them out everywhere.
        await tx
          .update(schema.user)
          .set({ role: d.active ? "staff" : "customer", name: d.name })
          .where(and(eq(schema.user.id, st.userId), ne(schema.user.role, "admin")));
        if (!d.active) await tx.delete(schema.session).where(eq(schema.session.userId, st.userId));
      }
    });
    revalidatePath("/admin/staff");
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function resetStaffPasswordAction(staffId: number, password: string): Promise<Result> {
  try {
    await assertRole(["admin"]);
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    const st = await db.query.staff.findFirst({ where: eq(schema.staff.id, staffId) });
    if (!st?.userId) throw new Error("This staff member has no login.");
    const hash = await hashPassword(password);
    const cred = await db.query.account.findFirst({
      where: and(eq(schema.account.userId, st.userId), eq(schema.account.providerId, "credential")),
    });
    if (cred) await db.update(schema.account).set({ password: hash }).where(eq(schema.account.id, cred.id));
    else
      await db
        .insert(schema.account)
        .values({ id: crypto.randomUUID(), accountId: st.userId, providerId: "credential", userId: st.userId, password: hash });
    await db.delete(schema.session).where(eq(schema.session.userId, st.userId));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* -------------------------------- Bookings ------------------------------ */

export async function setBookingStatusAction(
  id: string,
  status: "confirmed" | "completed" | "no_show",
): Promise<Result> {
  try {
    await assertRole(["admin", "staff"]);
    z.enum(["confirmed", "completed", "no_show"]).parse(status);
    const b = await db.query.booking.findFirst({ where: eq(schema.booking.id, id) });
    if (!b) throw new Error("Booking not found");
    if (b.status === "cancelled" || b.status === "pending_payment")
      throw new Error("Cancelled or unpaid-hold bookings can't be changed here.");
    await db.update(schema.booking).set({ status, updatedAt: new Date() }).where(eq(schema.booking.id, id));
    revalidatePath("/admin/bookings");
    revalidatePath("/staff");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function assignStaffAction(id: string, staffId: number | null): Promise<Result> {
  try {
    await assertRole(["admin", "staff"]);
    const b = await db.query.booking.findFirst({ where: eq(schema.booking.id, id) });
    if (!b) throw new Error("Booking not found");
    if (staffId) {
      const clash = await db.query.booking.findFirst({
        where: and(
          eq(schema.booking.date, b.date),
          eq(schema.booking.staffId, staffId),
          ne(schema.booking.id, id),
          sql`${schema.booking.status} in ('confirmed','completed','pending_payment')`,
          sql`${schema.booking.startMin} < ${b.endMin} and ${schema.booking.endMin} > ${b.startMin}`,
        ),
      });
      if (clash) throw new Error(`This therapist already has ${clash.code} at that time.`);
    }
    await db.update(schema.booking).set({ staffId, updatedAt: new Date() }).where(eq(schema.booking.id, id));
    revalidatePath("/admin/bookings");
    revalidatePath("/staff");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function recordCashAction(kind: "booking" | "order", id: string, amountRupees: number, note?: string): Promise<Result> {
  try {
    const u = await assertRole(["admin", "staff"]);
    const amount = Math.round(z.number().positive().max(10_00_000).parse(amountRupees) * 100);
    await db.transaction(async (tx) => {
      if (kind === "booking") {
        const [b] = await tx.select().from(schema.booking).where(eq(schema.booking.id, id)).for("update");
        if (!b) throw new Error("Booking not found");
        if (b.status === "cancelled") throw new Error("Booking is cancelled");
        const paid = b.amountPaid + amount;
        await tx
          .update(schema.booking)
          .set({ amountPaid: paid, paymentStatus: paid >= b.subtotal ? "paid" : "unpaid", updatedAt: new Date() })
          .where(eq(schema.booking.id, id));
        await tx.insert(schema.payment).values({
          kind, refId: b.id, refCode: b.code, method: "cash", type: "payment", amount, status: "success", note: note || null, recordedBy: u.id,
        });
      } else {
        const [o] = await tx.select().from(schema.shopOrder).where(eq(schema.shopOrder.id, id)).for("update");
        if (!o) throw new Error("Order not found");
        if (o.status === "cancelled") throw new Error("Order is cancelled");
        const paid = o.amountPaid + amount;
        await tx
          .update(schema.shopOrder)
          .set({ amountPaid: paid, paymentStatus: paid >= o.total ? "paid" : "unpaid", updatedAt: new Date() })
          .where(eq(schema.shopOrder.id, id));
        await tx.insert(schema.payment).values({
          kind, refId: o.id, refCode: o.code, method: "cash", type: "payment", amount, status: "success", note: note || null, recordedBy: u.id,
        });
      }
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/staff");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function quoteCancellationAction(id: string) {
  await assertRole(["admin"]);
  const b = await db.query.booking.findFirst({ where: eq(schema.booking.id, id) });
  if (!b) return null;
  const s = await getSettings();
  const q = cancellationQuote(b, s);
  return { ...q, refundable: Math.max(0, b.amountPaid - b.refundAmount), method: b.paymentMethod };
}

/** Admin cancel with full control over the refund (fee can be waived or changed). */
export async function adminCancelBookingAction(id: string, refundRupees: number, reason: string): Promise<Result> {
  try {
    const u = await assertRole(["admin"]);
    const b = await db.query.booking.findFirst({ where: eq(schema.booking.id, id) });
    if (!b) throw new Error("Booking not found");
    if (b.status === "cancelled") throw new Error("Already cancelled");
    const refundable = Math.max(0, b.amountPaid - b.refundAmount);
    const refund = Math.round(z.number().min(0).parse(refundRupees) * 100);
    if (refund > refundable) throw new Error(`Refund can't be more than ${refundable / 100}.`);

    let refundId: string | undefined;
    let status = "success";
    const viaGateway = refund > 0 && b.paymentMethod === "online" && b.razorpayPaymentId;
    if (viaGateway) {
      const r = await refundPayment(b.razorpayPaymentId!, refund, { booking: b.code, reason: "salon cancellation" });
      refundId = r.id;
      status = r.status === "processed" ? "success" : "pending";
    }
    await db.transaction(async (tx) => {
      const total = b.refundAmount + refund;
      await tx
        .update(schema.booking)
        .set({
          status: "cancelled",
          cancelledBy: "admin",
          cancelledAt: new Date(),
          cancelReason: reason.slice(0, 300) || "Cancelled by salon",
          refundAmount: total,
          cancellationFee: Math.max(0, refundable - refund),
          paymentStatus: total === 0 ? b.paymentStatus : total >= b.amountPaid ? "refunded" : "partially_refunded",
          updatedAt: new Date(),
        })
        .where(eq(schema.booking.id, id));
      if (refund > 0)
        await recordRefund(tx, {
          kind: "booking",
          refId: b.id,
          refCode: b.code,
          amount: refund,
          method: viaGateway ? "razorpay" : "cash",
          razorpayId: refundId,
          status,
          note: reason,
          by: u.id,
        });
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function rescheduleBookingAction(id: string, date: string, startMin: number): Promise<Result> {
  try {
    await assertRole(["admin"]);
    if (!isValidYMD(date)) throw new Error("Invalid date");
    const s = await getSettings();
    const b = await db.query.booking.findFirst({ where: eq(schema.booking.id, id) });
    if (!b) throw new Error("Booking not found");
    if (b.status !== "confirmed") throw new Error("Only confirmed bookings can be moved.");
    const duration = b.endMin - b.startMin;
    await db.transaction(async (tx) => {
      await lockDate(tx, date);
      const slots = await getSlots(date, duration, s, { staffId: b.staffId, excludeBookingId: id, ignoreLead: true, tx });
      const slot = slots.find((x) => x.start === startMin);
      if (!slot?.available) throw new Error("That time is full.");
      await tx
        .update(schema.booking)
        .set({ date, startMin, endMin: startMin + duration, updatedAt: new Date() })
        .where(eq(schema.booking.id, id));
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function adminSlotsAction(id: string, date: string) {
  await assertRole(["admin"]);
  if (!isValidYMD(date)) return [];
  const b = await db.query.booking.findFirst({ where: eq(schema.booking.id, id) });
  if (!b) return [];
  const s = await getSettings();
  return getSlots(date, b.endMin - b.startMin, s, { staffId: b.staffId, excludeBookingId: id, ignoreLead: true });
}

/* --------------------------------- Orders ------------------------------- */

export async function setOrderStatusAction(id: string, status: "placed" | "ready" | "picked_up"): Promise<Result> {
  try {
    await assertRole(["admin", "staff"]);
    z.enum(["placed", "ready", "picked_up"]).parse(status);
    const o = await db.query.shopOrder.findFirst({ where: eq(schema.shopOrder.id, id) });
    if (!o) throw new Error("Order not found");
    if (o.status === "cancelled" || o.status === "pending_payment") throw new Error("This order can't be changed.");
    if (status === "picked_up" && o.paymentStatus !== "paid") throw new Error("Record the payment before handing over.");
    await db.update(schema.shopOrder).set({ status, updatedAt: new Date() }).where(eq(schema.shopOrder.id, id));
    revalidatePath("/admin/orders");
    revalidatePath("/staff");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function adminCancelOrderAction(id: string, refundRupees: number, reason: string): Promise<Result> {
  try {
    const u = await assertRole(["admin"]);
    const o = await db.query.shopOrder.findFirst({ where: eq(schema.shopOrder.id, id) });
    if (!o) throw new Error("Order not found");
    if (o.status === "cancelled") throw new Error("Already cancelled");
    if (o.status === "picked_up") throw new Error("Already picked up.");
    const refundable = Math.max(0, o.amountPaid - o.refundAmount);
    const refund = Math.round(z.number().min(0).parse(refundRupees) * 100);
    if (refund > refundable) throw new Error(`Refund can't be more than ${refundable / 100}.`);
    let refundId: string | undefined;
    let status = "success";
    const viaGateway = refund > 0 && o.paymentMethod === "online" && o.razorpayPaymentId;
    if (viaGateway) {
      const r = await refundPayment(o.razorpayPaymentId!, refund, { order: o.code });
      refundId = r.id;
      status = r.status === "processed" ? "success" : "pending";
    }
    await db.transaction(async (tx) => {
      const total = o.refundAmount + refund;
      await tx
        .update(schema.shopOrder)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: reason.slice(0, 300) || "Cancelled by salon",
          refundAmount: total,
          paymentStatus: total === 0 ? o.paymentStatus : total >= o.amountPaid ? "refunded" : "partially_refunded",
          stockRestored: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.shopOrder.id, id));
      if (!o.stockRestored) await restoreStock(tx, [o.id]);
      if (refund > 0)
        await recordRefund(tx, {
          kind: "order", refId: o.id, refCode: o.code, amount: refund, method: viaGateway ? "razorpay" : "cash",
          razorpayId: refundId, status, note: reason, by: u.id,
        });
    });
    revalidatePath("/admin", "layout");
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* -------------------------------- Uploads ------------------------------- */

export async function uploadImageAction(form: FormData): Promise<Result<{ url: string }>> {
  try {
    await assertRole(["admin"]);
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Uploads need Vercel Blob. Paste an image URL instead.");
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("No file");
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type))
      throw new Error("Use a JPG, PNG, WebP or AVIF image.");
    if (file.size > 4 * 1024 * 1024) throw new Error("Image must be under 4 MB.");
    const { put } = await import("@vercel/blob");
    const ext = file.type.split("/")[1];
    const blob = await put(`uploads/${crypto.randomUUID()}.${ext}`, file, { access: "public", contentType: file.type });
    return { ok: true, url: blob.url };
  } catch (e) {
    return fail(e);
  }
}
