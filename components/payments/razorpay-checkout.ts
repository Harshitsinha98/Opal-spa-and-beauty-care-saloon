"use client";

import type { CheckoutPayload } from "@/app/actions/booking";

type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: unknown) => void) => void };
  }
}

let loading: Promise<boolean> | null = null;

export function loadRazorpay() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  loading ??= new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => {
      loading = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return loading;
}

/** Opens Razorpay Checkout. Resolves with the signed response, or null if the customer closed it. */
export async function payWithRazorpay(p: CheckoutPayload, businessName: string): Promise<RzpResponse | null> {
  const ok = await loadRazorpay();
  if (!ok || !window.Razorpay) throw new Error("Could not load the payment window. Check your connection and try again.");
  return new Promise((resolve) => {
    let settled = false;
    const rzp = new window.Razorpay!({
      key: p.keyId,
      order_id: p.orderId,
      amount: p.amount,
      currency: "INR",
      name: businessName,
      description: p.description.slice(0, 250),
      prefill: { name: p.name, email: p.email, contact: p.phone },
      theme: { color: "#d6336c" },
      handler: (r: RzpResponse) => {
        settled = true;
        resolve(r);
      },
      modal: {
        ondismiss: () => {
          if (!settled) resolve(null);
        },
        confirm_close: true,
      },
    });
    rzp.on("payment.failed", () => {
      // Razorpay keeps the modal open so the customer can retry; nothing to do here.
    });
    rzp.open();
  });
}
