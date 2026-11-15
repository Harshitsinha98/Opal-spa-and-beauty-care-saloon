"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { rupees, durationLabel } from "@/lib/format";

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  durationMin: number;
  price: number;
  image: string | null;
  category: string;
};

/**
 * Editorial price list. On desktop, hovering a row floats that treatment's
 * photo beside the cursor.
 */
export function MenuList({ items, start = 1, bookable = true }: { items: MenuItem[]; start?: number; bookable?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 26 });
  const sy = useSpring(y, { stiffness: 220, damping: 26 });

  const onMove = (e: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  const current = items.find((i) => i.id === hover);

  return (
    <div ref={box} className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <ul className="border-t border-line">
        {items.map((s, i) => (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: (i % 6) * 0.05 }}
            className="group border-b border-line"
            onPointerEnter={() => setHover(s.id)}
          >
            <Link
              href={bookable ? `/book?service=${s.id}` : "/services"}
              className="grid grid-cols-12 items-baseline gap-x-4 gap-y-2 py-6 transition-colors md:py-7"
              data-cursor={s.image ? "Book" : undefined}
            >
              <span className="col-span-2 font-display text-lg text-mute md:col-span-1">
                {String(start + i).padStart(2, "0")}
              </span>
              <span className="col-span-10 md:col-span-6">
                <span className="display block text-[1.9rem] leading-tight transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-3 md:text-[2.4rem]">
                  {s.name}
                </span>
                <span className="mt-1.5 block max-w-xl text-sm leading-relaxed text-mute">{s.description}</span>
              </span>
              <span className="col-span-6 col-start-3 text-sm text-mute md:col-span-2 md:col-start-auto">
                {durationLabel(s.durationMin)}
              </span>
              <span className="col-span-4 text-right font-display text-2xl md:col-span-3">
                {rupees(s.price)}
                <span className="ml-3 hidden text-sm font-sans text-wine opacity-0 transition-opacity group-hover:opacity-100 md:inline">
                  Book <Arrow />
                </span>
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>

      <motion.div
        className="pointer-events-none absolute left-0 top-0 z-10 hidden md:block"
        style={{ x: sx, y: sy }}
        aria-hidden
      >
        <AnimatePresence>
          {current?.image && (
            <motion.div
              key={current.id}
              className="h-64 w-48 -translate-x-[115%] -translate-y-1/2 overflow-hidden"
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <img src={current.image} alt="" className="h-full w-full object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
