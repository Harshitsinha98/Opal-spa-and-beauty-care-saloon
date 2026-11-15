"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useCart } from "./CartContext";
import { rupees } from "@/lib/format";
import { ProductSwatch } from "../shop/ProductSwatch";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, total } = useCart();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[55] bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-label="Your bag"
            data-lenis-prevent
            className="fixed inset-y-2 right-2 z-[56] flex w-[calc(100%-1rem)] max-w-md flex-col overflow-hidden rounded-3xl bg-paper shadow-[var(--shadow-lift)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <p className="display text-3xl">Your bag</p>
              <button onClick={() => setOpen(false)} className="text-sm text-mute hover:text-ink">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {lines.length === 0 ? (
                <div className="py-16 text-center text-mute">
                  <p>Nothing here yet.</p>
                  <Link href="/shop" onClick={() => setOpen(false)} className="link-u mt-3 inline-block text-brand">
                    Browse the shop
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {lines.map((l) => (
                    <li key={l.productId} className="flex gap-4 py-4">
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-ivory">
                        <ProductSwatch name={l.name} tone={l.tone} image={l.image} small />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <p className="font-medium">{l.name}</p>
                          <p>{rupees(l.price * l.qty)}</p>
                        </div>
                        {l.size && <p className="text-xs text-mute">{l.size}</p>}
                        <div className="mt-auto flex items-center gap-3 text-sm">
                          <div className="flex items-center rounded-full border border-line bg-white">
                            <button className="px-2.5 py-1" onClick={() => setQty(l.productId, l.qty - 1)} aria-label="Decrease">−</button>
                            <span className="w-6 text-center">{l.qty}</span>
                            <button className="px-2.5 py-1" onClick={() => setQty(l.productId, l.qty + 1)} aria-label="Increase">+</button>
                          </div>
                          <button className="text-xs text-mute underline" onClick={() => remove(l.productId)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {lines.length > 0 && (
              <div className="border-t border-line px-6 py-5">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{rupees(total)}</span>
                </div>
                <p className="mt-1 text-xs text-mute">Pickup only, from the salon front desk in Arera Colony.</p>
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="mt-4 block rounded-full bg-brand py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
