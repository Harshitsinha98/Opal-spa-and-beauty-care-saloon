"use client";

import { AnimatePresence, motion } from "motion/react";
import { Arrow } from "@/components/Arrow";
import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import media from "@/lib/media.json";
import { getLenis } from "../motion/SmoothScroll";

type Name = Exclude<keyof typeof media, "reception-walk">;

/** Click any child with data-lightbox="<photo name>" to open it full screen. Arrow keys move between photos. */
export function Lightbox({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Name[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  const onClick = (e: React.MouseEvent) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-lightbox]");
    if (!t) return;
    const names = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-lightbox]")).map((el) => el.dataset.lightbox as Name);
    setList(names);
    setOpen(names.indexOf(t.dataset.lightbox as Name));
  };

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + list.length) % list.length)), [list.length]);

  useEffect(() => {
    if (open === null) return;
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      getLenis()?.start();
    };
  }, [open, close, step]);

  const m = open !== null ? media[list[open]] : null;

  return (
    <div onClick={onClick}>
      {children}
      <AnimatePresence>
        {m && open !== null && (
          <motion.div
            className="fixed inset-0 z-[75] flex items-center justify-center bg-ink/95 p-4 md:p-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            role="dialog"
            aria-label={m.alt}
          >
            <motion.div
              key={list[open]}
              className="relative h-full w-full"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image src={m.src} alt={m.alt} fill sizes="100vw" className="object-contain" placeholder="blur" blurDataURL={m.blurDataURL} />
            </motion.div>
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center text-sm text-blush/80">{m.alt}</p>
            <button className="absolute right-5 top-5 text-sm text-blush hover:text-paper" onClick={close}>
              Close
            </button>
            <button
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-blush/30 text-blush hover:bg-paper hover:text-ink"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
            >
              <Arrow dir="left" />
            </button>
            <button
              aria-label="Next photo"
              className="absolute right-3 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-blush/30 text-blush hover:bg-paper hover:text-ink"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
            >
              <Arrow />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
