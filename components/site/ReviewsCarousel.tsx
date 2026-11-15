"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { Arrow } from "@/components/Arrow";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Review } from "@/lib/reviews";

const INTERVAL = 6500;

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className} aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} viewBox="0 0 20 20" className="inline-block h-4 w-4" aria-hidden>
            <defs>
              <linearGradient id={`s${i}-${value}`}>
                <stop offset={fill} stopColor="currentColor" />
                <stop offset={fill} stopColor="currentColor" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#s${i}-${value})`}
              d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L10 15l-5.3 2.8 1.1-5.9L1.4 7.8l6-.8z"
            />
          </svg>
        );
      })}
    </span>
  );
}

export function ReviewsCarousel({
  reviews,
  rating,
  count,
  mapsUrl,
}: {
  reviews: Review[];
  rating: number;
  count: number;
  mapsUrl: string;
}) {
  const [[index, dir], setState] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const n = reviews.length;

  const go = useCallback((d: number) => setState(([i]) => [(i + d + n) % n, d]), [n]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !visible) return;
    const t = setTimeout(() => go(1), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused, visible, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
  };

  const r = reviews[index];
  const long = r.text.length > 140;

  return (
    <div
      ref={root}
      className="grid gap-12 md:grid-cols-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="md:col-span-4">
        <p className="eyebrow">What guests write</p>
        <p className="display mt-6 text-[6.5rem] leading-none text-plum md:text-[8rem]">{rating.toFixed(1)}</p>
        <Stars value={rating} className="mt-2 flex gap-0.5 text-brass" />
        <p className="mt-3 text-sm text-mute">
          From {count} reviews on Google
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-u mt-6 inline-block text-sm text-wine"
        >
          Read them all on Google <Arrow dir="out" />
        </a>
      </div>

      <div className="relative md:col-span-8" aria-roledescription="carousel" aria-label="Google reviews">
        <div className="relative min-h-[19rem] overflow-hidden md:min-h-[22rem]" data-cursor="Drag">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.figure
              key={index}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={onDragEnd}
              className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${n}`}
            >
              <span aria-hidden className="display block text-[5rem] leading-[0.5] text-rose">“</span>
              <blockquote
                className={
                  long
                    ? "display mt-4 text-[1.75rem] leading-[1.18] text-ink md:text-[2.4rem]"
                    : "display mt-4 text-[2.2rem] leading-[1.1] text-ink md:text-[3.3rem]"
                }
              >
                {r.text}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4 text-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush font-display text-lg text-plum">
                  {r.name.trim()[0]?.toUpperCase()}
                </span>
                <span>
                  <span className="block font-medium text-ink">{r.name}</span>
                  <span className="block text-mute">
                    {r.meta ? `${r.meta} · ` : ""}Google review · {r.when}
                  </span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center gap-6">
          <button onClick={() => go(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-line transition-colors hover:border-plum hover:bg-plum hover:text-paper" aria-label="Previous review">
            <Arrow dir="left" />
          </button>
          <button onClick={() => go(1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-line transition-colors hover:border-plum hover:bg-plum hover:text-paper" aria-label="Next review">
            <Arrow />
          </button>
          <div className="relative h-px flex-1 bg-line">
            <motion.div
              key={`${index}-${paused}-${visible}`}
              className="absolute inset-y-0 left-0 bg-plum"
              initial={{ width: "0%" }}
              animate={{ width: paused || !visible ? "0%" : "100%" }}
              transition={{ duration: paused || !visible ? 0 : INTERVAL / 1000, ease: "linear" }}
            />
          </div>
          <span className="font-display text-lg tabular-nums text-mute">
            {String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
