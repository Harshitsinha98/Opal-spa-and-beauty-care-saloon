"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { motion } from "motion/react";
import { useCart } from "../cart/CartContext";
import { useSession } from "@/lib/auth-client";
import { rupees } from "@/lib/format";
import { placeOrderAction, refreshCartAction } from "@/app/actions/shop";
import { resumePaymentAction, verifyPaymentAction, type CheckoutPayload } from "@/app/actions/booking";
import { payWithRazorpay } from "../payments/razorpay-checkout";
import { ProductSwatch } from "./ProductSwatch";

export function CheckoutForm({ methods, businessName, address }: { methods: ("online" | "cash")[]; businessName: string; address: string }) {
  const { lines, replace, clear, total } = useCart();
  const { data: session, isPending } = useSession();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [method, setMethod] = useState<"online" | "cash">(methods[0] ?? "cash");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ code: string; paid: boolean } | null>(null);
  const [unpaid, setUnpaid] = useState<{ orderId: string; code: string } | null>(null);

  // Re-price the bag from the server so stale prices or sold-out items never reach payment.
  useEffect(() => {
    if (!lines.length) return;
    refreshCartAction(lines.map((l) => l.productId)).then((fresh) => {
      let changed = false;
      const next = lines
        .map((l) => {
          const f = fresh.find((x) => x.id === l.productId);
          if (!f || !f.active || f.stock <= 0) {
            changed = true;
            return null;
          }
          const qty = Math.min(l.qty, f.stock);
          if (qty !== l.qty || f.price !== l.price) changed = true;
          return { ...l, price: f.price, qty, name: f.name, image: f.image, tone: f.tone, size: f.size };
        })
        .filter(Boolean) as typeof lines;
      if (changed) {
        replace(next);
        setNotice("We updated your bag to match current prices and stock.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const u = session.user as { name: string; email: string; phone?: string | null };
    setForm((f) => ({ name: f.name || u.name, email: f.email || u.email, phone: f.phone || u.phone || "" }));
  }, [session]);

  async function pay(checkout: CheckoutPayload, orderId: string, code: string) {
    let res;
    try {
      res = await payWithRazorpay(checkout, businessName);
    } catch (e) {
      setUnpaid({ orderId, code });
      return setError((e as Error).message);
    }
    if (!res) return setUnpaid({ orderId, code });
    const v = await verifyPaymentAction(res);
    clear();
    setUnpaid(null);
    if (!v.ok) setError(v.error);
    setDone({ code, paid: v.ok });
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await placeOrderAction({ items: lines.map((l) => ({ productId: l.productId, qty: l.qty })), ...form, method });
      if (!r.ok) return setError(r.error);
      if (!r.checkout) {
        clear();
        return setDone({ code: r.code, paid: false });
      }
      await pay(r.checkout, r.orderId, r.code);
    });
  };

  const retry = () =>
    unpaid &&
    start(async () => {
      setError(null);
      const r = await resumePaymentAction("order", unpaid.orderId);
      if (!r.ok) {
        setUnpaid(null);
        return setError(r.error);
      }
      await pay(r.checkout, unpaid.orderId, unpaid.code);
    });

  if (done) {
    return (
      <section className="mx-auto max-w-2xl px-5 pb-32 pt-40">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">Order {done.code}</p>
          <h1 className="display mt-4 text-6xl">Thank you.</h1>
          <p className="mt-6 leading-relaxed text-ink/80">
            {done.paid ? "Payment received. " : "Pay at the counter when you collect. "}We'll keep your order at the front desk. Collect it during
            opening hours at {address}. Bring your order code.
          </p>
          {error && <p className="mt-4 text-sm text-warn">{error}</p>}
          <Link href="/account" className="mt-10 inline-block rounded-full bg-brand px-7 py-4 text-sm text-paper">
            View my orders
          </Link>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-32 pt-36 md:px-10">
      <p className="eyebrow">Checkout · pickup at the salon</p>
      <h1 className="display mt-4 text-4xl md:text-6xl">Your order</h1>
      {notice && <p className="mt-6 text-sm text-warn">{notice}</p>}

      {lines.length === 0 ? (
        <p className="mt-10 text-mute">
          Your bag is empty.{" "}
          <Link href="/shop" className="text-accent underline">
            Visit the shop
          </Link>
        </p>
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {isPending ? (
              <div className="h-40 animate-pulse bg-ivory" />
            ) : !session?.user ? (
              <div className="card p-8">
                <p className="display text-3xl">Sign in to place your order</p>
                <p className="mt-2 text-sm text-mute">Your bag is saved on this device.</p>
                <div className="mt-6 flex gap-3">
                  <Link href="/sign-in?next=/checkout" className="rounded-full bg-brand px-6 py-3 text-sm text-paper">
                    Sign in
                  </Link>
                  <Link href="/sign-up?next=/checkout" className="rounded-full border border-line px-6 py-3 text-sm">
                    Create an account
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1.5 block text-mute">Full name</span>
                  <input className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block text-mute">Mobile number</span>
                  <input className="field" required inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1.5 block text-mute">Email</span>
                  <input className="field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <fieldset className="sm:col-span-2">
                  <legend className="mb-3 text-sm text-mute">Payment</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {methods.map((m) => (
                      <label key={m} className={clsx("flex cursor-pointer items-start gap-3 rounded-2xl border p-5", method === m ? "border-brand bg-ivory" : "border-line bg-white")}>
                        <input type="radio" className="mt-1 accent-[#0d5e52]" checked={method === m} onChange={() => setMethod(m)} />
                        <span>
                          <span className="block font-medium">{m === "online" ? "Pay now" : "Pay at pickup"}</span>
                          <span className="text-sm text-mute">{m === "online" ? "UPI, cards, net banking via Razorpay" : "Cash, UPI or card at the counter"}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {methods.length === 0 && <p className="text-sm text-bad">Ordering is paused right now.</p>}
                </fieldset>
                {unpaid ? (
                  <div className="rounded-2xl border border-warn/40 bg-warn/5 p-5 sm:col-span-2">
                    <p className="font-medium">Payment not finished</p>
                    <p className="mt-1 text-sm text-mute">We're holding these items for a few minutes.</p>
                    <button type="button" onClick={retry} disabled={pending} className="mt-4 rounded-full bg-brand px-6 py-3 text-sm text-paper">
                      Try payment again
                    </button>
                  </div>
                ) : (
                  <button disabled={pending || !methods.length} className="rounded-full bg-brand py-4 text-sm text-paper hover:bg-brand-700 disabled:opacity-60 sm:col-span-2 sm:w-fit sm:px-12">
                    {pending ? "Please wait…" : method === "online" ? `Pay ${rupees(total)}` : "Place order"}
                  </button>
                )}
                {error && <p className="text-sm text-bad sm:col-span-2" role="alert">{error}</p>}
              </form>
            )}
          </div>
          <aside className="lg:col-span-5">
            <div className="card p-6">
              <ul className="divide-y divide-line">
                {lines.map((l) => (
                  <li key={l.productId} className="flex gap-4 py-4 first:pt-0">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-ivory">
                      <ProductSwatch name={l.name} tone={l.tone} image={l.image} small />
                    </div>
                    <div className="flex flex-1 justify-between text-sm">
                      <span>
                        {l.name}
                        <span className="block text-mute">× {l.qty}</span>
                      </span>
                      <span>{rupees(l.price * l.qty)}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                <span className="text-sm">Total</span>
                <span className="display text-3xl">{rupees(total)}</span>
              </div>
              <p className="mt-3 text-xs text-mute">Pickup only from the front desk. No delivery.</p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
