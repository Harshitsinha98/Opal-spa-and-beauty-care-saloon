"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = { productId: number; name: string; price: number; qty: number; tone: string; image: string | null; size: string | null };

type Ctx = {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (l: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "opal-bag-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const add = useCallback((l: Omit<CartLine, "qty">, qty = 1) => {
    setLines((cur) => {
      const ex = cur.find((c) => c.productId === l.productId);
      if (ex) return cur.map((c) => (c.productId === l.productId ? { ...c, qty: Math.min(20, c.qty + qty) } : c));
      return [...cur, { ...l, qty }];
    });
    setOpen(true);
  }, []);
  const setQty = useCallback(
    (id: number, qty: number) =>
      setLines((cur) => (qty <= 0 ? cur.filter((c) => c.productId !== id) : cur.map((c) => (c.productId === id ? { ...c, qty: Math.min(20, qty) } : c)))),
    [],
  );
  const remove = useCallback((id: number) => setLines((cur) => cur.filter((c) => c.productId !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.qty * l.price, 0),
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
      replace: setLines,
    }),
    [lines, open, add, setQty, remove, clear],
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
