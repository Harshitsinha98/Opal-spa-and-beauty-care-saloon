import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema, type DbOrTx } from "./db";
import { razorpay } from "./razorpay";

type Settled = { kind: "booking" | "order"; code: string; id: string } | null;

async function insertLedger(tx: DbOrTx, row: typeof schema.payment.$inferInsert) {
  await tx.insert(schema.payment).values(row).onConflictDoNothing({ target: schema.payment.razorpayId });
}

/**
 * Marks the booking or shop order behind a Razorpay order as paid.
 * Idempotent: the browser callback and the webhook can both call this safely.
 */
export async function settleRazorpayPayment(rzpOrderId: string, paymentId: string, amount: number): Promise<Settled> {
  return db.transaction(async (tx) => {
    const [b] = await tx
      .select()
      .from(schema.booking)
      .where(eq(schema.booking.razorpayOrderId, rzpOrderId))
      .for("update");
    if (b) {
      if (b.paymentStatus === "unpaid") {
        const revive = b.status === "pending_payment" || (b.status === "cancelled" && b.cancelledBy === "system");
        await tx
          .update(schema.booking)
          .set({
            status: revive ? "confirmed" : b.status,
            paymentStatus: "paid",
            amountPaid: amount,
            razorpayPaymentId: paymentId,
            holdExpiresAt: null,
            ...(revive ? { cancelledAt: null, cancelledBy: null, cancelReason: null } : {}),
            updatedAt: new Date(),
          })
          .where(eq(schema.booking.id, b.id));
        await insertLedger(tx, {
          kind: "booking",
          refId: b.id,
          refCode: b.code,
          method: "razorpay",
          type: "payment",
          amount,
          status: "success",
          razorpayId: paymentId,
        });
      }
      return { kind: "booking" as const, code: b.code, id: b.id };
    }

    const [o] = await tx
      .select()
      .from(schema.shopOrder)
      .where(eq(schema.shopOrder.razorpayOrderId, rzpOrderId))
      .for("update");
    if (o) {
      if (o.paymentStatus === "unpaid") {
        const revive = o.status === "pending_payment" || (o.status === "cancelled" && o.stockRestored);
        if (revive && o.stockRestored) {
          // The hold had expired and stock was given back; take it again.
          const items = await tx.select().from(schema.shopOrderItem).where(eq(schema.shopOrderItem.orderId, o.id));
          for (const it of items) {
            if (!it.productId) continue;
            await tx
              .update(schema.product)
              .set({ stock: sql`greatest(${schema.product.stock} - ${it.qty}, 0)` })
              .where(eq(schema.product.id, it.productId));
          }
        }
        await tx
          .update(schema.shopOrder)
          .set({
            status: revive ? "placed" : o.status,
            paymentStatus: "paid",
            amountPaid: amount,
            razorpayPaymentId: paymentId,
            holdExpiresAt: null,
            stockRestored: false,
            ...(revive ? { cancelledAt: null, cancelReason: null } : {}),
            updatedAt: new Date(),
          })
          .where(eq(schema.shopOrder.id, o.id));
        await insertLedger(tx, {
          kind: "order",
          refId: o.id,
          refCode: o.code,
          method: "razorpay",
          type: "payment",
          amount,
          status: "success",
          razorpayId: paymentId,
        });
      }
      return { kind: "order" as const, code: o.code, id: o.id };
    }
    return null;
  });
}

/**
 * Asks Razorpay for the real state of a payment (never trust amounts from the browser),
 * captures it if the account is on manual capture, then settles it.
 */
export async function confirmWithGateway(rzpOrderId: string, paymentId: string) {
  const rp = razorpay();
  let p = await rp.payments.fetch(paymentId);
  if (p.order_id !== rzpOrderId) throw new Error("Payment does not belong to this order.");
  if (p.status === "authorized") {
    p = await rp.payments.capture(paymentId, Number(p.amount), "INR");
  }
  if (p.status !== "captured") throw new Error(`Payment is ${p.status}.`);
  return settleRazorpayPayment(rzpOrderId, paymentId, Number(p.amount));
}

export async function recordRefund(
  tx: DbOrTx,
  args: { kind: "booking" | "order"; refId: string; refCode: string; amount: number; method: "razorpay" | "cash"; razorpayId?: string; status: string; note?: string; by?: string },
) {
  await insertLedger(tx, {
    kind: args.kind,
    refId: args.refId,
    refCode: args.refCode,
    method: args.method,
    type: "refund",
    amount: args.amount,
    status: args.status,
    razorpayId: args.razorpayId ?? null,
    note: args.note ?? null,
    recordedBy: args.by ?? null,
  });
}

export async function markRefundStatus(refundId: string, status: "success" | "failed") {
  await db
    .update(schema.payment)
    .set({ status })
    .where(and(eq(schema.payment.razorpayId, refundId), eq(schema.payment.type, "refund")));
}
