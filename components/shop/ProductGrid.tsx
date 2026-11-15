"use client";

import { motion } from "motion/react";
import { useCart } from "../cart/CartContext";
import { ProductSwatch } from "./ProductSwatch";
import { rupees } from "@/lib/format";

type P = {
  id: number;
  name: string;
  brand: string | null;
  description: string;
  size: string | null;
  price: number;
  stock: number;
  image: string | null;
  tone: string;
};

export function ProductGrid({ products }: { products: P[] }) {
  const { add } = useCart();
  if (!products.length) return <p className="text-mute">New products are on the way.</p>;
  return (
    <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, i) => (
        <motion.article
          key={p.id}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: (i % 3) * 0.08 }}
          className="group"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
            <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105">
              <ProductSwatch name={p.name} tone={p.tone} image={p.image} />
            </div>
            {p.stock <= 0 && (
              <span className="absolute left-4 top-4 bg-paper px-3 py-1 text-xs uppercase tracking-[0.15em] text-mute">Sold out</span>
            )}
            {p.stock > 0 && p.stock <= 3 && (
              <span className="absolute left-4 top-4 bg-paper px-3 py-1 text-xs uppercase tracking-[0.15em] text-wine">Only {p.stock} left</span>
            )}
            <button
              disabled={p.stock <= 0}
              onClick={() => add({ productId: p.id, name: p.name, price: p.price, tone: p.tone, image: p.image, size: p.size })}
              className="absolute inset-x-4 bottom-4 translate-y-3 rounded-full bg-plum py-3 text-sm text-paper opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100 disabled:hidden max-md:translate-y-0 max-md:opacity-100"
            >
              Add to bag · {rupees(p.price)}
            </button>
          </div>
          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              {p.brand && <p className="eyebrow">{p.brand}</p>}
              <h2 className="display mt-1 text-[1.9rem] leading-tight">{p.name}</h2>
              {p.size && <p className="mt-0.5 text-sm text-mute">{p.size}</p>}
            </div>
            <p className="font-display text-2xl">{rupees(p.price)}</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-mute">{p.description}</p>
        </motion.article>
      ))}
    </div>
  );
}
