import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";

let client: Razorpay | null = null;

export function razorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Online payments are not configured yet.");
  client ??= new Razorpay({ key_id, key_secret });
  return client;
}

export function publicKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Checkout handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

export async function createRazorpayOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  return razorpay().orders.create({ amount: amountPaise, currency: "INR", receipt, notes });
}

export async function refundPayment(paymentId: string, amountPaise: number, notes: Record<string, string>) {
  return razorpay().payments.refund(paymentId, { amount: amountPaise, speed: "normal", notes });
}

/** Fetch captured payments for an order, used to reconcile when the browser callback is lost. */
export async function capturedPaymentForOrder(orderId: string) {
  const res = await razorpay().orders.fetchPayments(orderId);
  const items = (res?.items ?? []) as { id: string; status: string; amount: number | string }[];
  return items.find((p) => p.status === "captured") ?? null;
}
