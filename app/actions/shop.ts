"use server";

import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { getSettings, availableMethods } from "@/lib/settings";
import { getCurrentUser } from "@/lib/session";
import { expireStaleHolds, restoreStock } from "@/lib/booking";
import { makeCode } from "@/lib/codes";
import { createRazorpayOrder, publicKeyId } from "@/lib/razorpay";
import type { CheckoutPayload } from "./booking";

const orderSchema = z.object({
  items: z
    .array(z.object({ productId: z.number().int().positive(), qty: z.number().int().min(1).max(20) }))
    .min(1, "Your bag is empty")
    .max(30),
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number"),
  email: z.email("Enter a valid email").max(120),
  method: z.enum(["online", "cash"]),
});

/** Current price and stock for items in a client-side bag. */
export async function refreshCartAction(productIds: number[]) {
  const ids = [...new Set(productIds.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 50);
  if (!ids.length) return [];
  await expireStaleHolds();
  return db
    .select({
      id: schema.product.id,
      name: schema.product.name,
      price: schema.product.price,
      stock: schema.product.stock,
      active: schema.product.active,
      image: schema.product.image,
      tone: schema.product.tone,
      size: schema.product.size,
    })
    .from(schema.product)
    .where(inArray(schema.product.id, ids));
}

export async function placeOrderAction(
  input: z.input<typeof orderSchema>,
): Promise<{ ok: true; code: string; orderId: string; checkout?: CheckoutPayload } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to place an order." };
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details" };
  const d = parsed.data;
  const s = await getSettings();
  if (!availableMethods(s).includes(d.method)) return { ok: false, error: "That payment option is not available." };

  // Merge duplicate lines.
  const qtyById = new Map<number, number>();
  for (const it of d.items) qtyById.set(it.productId, (qtyById.get(it.productId) ?? 0) + it.qty);

  await expireStaleHolds();
  const online = d.method === "online";
  const code = makeCode("OS");

  let result: { id: string; total: number };
  try {
    result = await db.transaction(async (tx) => {
      const products = await tx
        .select()
        .from(schema.product)
        .where(inArray(schema.product.id, [...qtyById.keys()]))
        .for("update");
      let total = 0;
      for (const [id, qty] of qtyById) {
        const p = products.find((x) => x.id === id);
        if (!p || !p.active) throw new Error("A product in your bag is no longer sold.");
        if (p.stock < qty) throw new Error(`Only ${p.stock} left of ${p.name}.`);
        total += p.price * qty;
      }
      for (const [id, qty] of qtyById) {
        await tx
          .update(schema.product)
          .set({ stock: sql`${schema.product.stock} - ${qty}` })
          .where(eq(schema.product.id, id));
      }
      const [o] = await tx
        .insert(schema.shopOrder)
        .values({
          code,
          userId: user.id,
          customerName: d.name,
          phone: d.phone,
          email: d.email,
          status: online ? "pending_payment" : "placed",
          paymentMethod: d.method,
          total,
          holdExpiresAt: online ? new Date(Date.now() + s.booking.holdMinutes * 60_000) : null,
        })
        .returning({ id: schema.shopOrder.id });
      await tx.insert(schema.shopOrderItem).values(
        [...qtyById].map(([id, qty]) => {
          const p = products.find((x) => x.id === id)!;
          return { orderId: o.id, productId: id, name: p.name, price: p.price, qty };
        }),
      );
      return { id: o.id, total };
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.startsWith("Only ") || msg.startsWith("A product")) return { ok: false, error: msg };
    console.error("placeOrder", e);
    return { ok: false, error: "Could not place the order. Please try again." };
  }

  revalidatePath("/shop");
  if (!online) return { ok: true, code, orderId: result.id };

  try {
    const order = await createRazorpayOrder(result.total, code, { orderId: result.id, kind: "order" });
    await db.update(schema.shopOrder).set({ razorpayOrderId: order.id }).where(eq(schema.shopOrder.id, result.id));
    return {
      ok: true,
      code,
      orderId: result.id,
      checkout: {
        orderId: order.id,
        amount: result.total,
        keyId: publicKeyId(),
        name: d.name,
        email: d.email,
        phone: d.phone,
        description: `Shop order ${code}`,
      },
    };
  } catch (e) {
    console.error("razorpay order", e);
    // Release the stock straight away.
    await db.transaction(async (tx) => {
      const [o] = await tx
        .update(schema.shopOrder)
        .set({ status: "cancelled", cancelReason: "Payment gateway error", cancelledAt: new Date(), stockRestored: true })
        .where(and(eq(schema.shopOrder.id, result.id), eq(schema.shopOrder.stockRestored, false)))
        .returning({ id: schema.shopOrder.id });
      if (o) await restoreStock(tx, [o.id]);
    });
    return { ok: false, error: "Online payment is unavailable right now. Try paying at pickup instead." };
  }
}
