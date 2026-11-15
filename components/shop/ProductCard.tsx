"use client";

import { useCart } from "../cart/CartContext";
import { ProductSwatch } from "./ProductSwatch";
import { rupees } from "@/lib/format";

export type ProductCardData = {
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

export function ProductCard({ p }: { p: ProductCardData }) {
  const { add } = useCart();
  const soldOut = p.stock <= 0;
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-square overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105">
          <ProductSwatch name={p.name} tone={p.tone} image={p.image} />
        </div>
        <div className="absolute left-3 top-3 flex gap-2">
          {soldOut && <span className="pill bg-white text-mute">Sold out</span>}
          {!soldOut && p.stock <= 3 && <span className="pill bg-accent text-white">Only {p.stock} left</span>}
          {!soldOut && p.stock > 3 && <span className="pill bg-white/90 text-brand">In stock</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {p.brand && <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-mute">{p.brand}</p>}
        <h3 className="display mt-1 text-lg">{p.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-mute">{p.description}</p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <p>
            <span className="font-display text-2xl font-semibold">{rupees(p.price)}</span>
            {p.size && <span className="ml-1.5 text-xs text-mute">/ {p.size}</span>}
          </p>
          <button
            disabled={soldOut}
            onClick={() => add({ productId: p.id, name: p.name, price: p.price, tone: p.tone, image: p.image, size: p.size })}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-brand disabled:opacity-30"
            aria-label={`Add ${p.name} to bag`}
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
