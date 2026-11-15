"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Photo, type PhotoName } from "../Photo";

const STOPS: { photo: PhotoName; title: string; note: string }[] = [
  { photo: "entrance", title: "The door", note: "Glass doors and wood-panelled walls, with potted plants along the floor." },
  { photo: "reception", title: "Front desk", note: "Carved jaali panels at the counter and a lit mirror station behind it." },
  { photo: "lounge", title: "The lounge", note: "A velvet corner sofa, fresh flowers and a brass Buddha." },
  { photo: "corridor", title: "The corridor", note: "Floral drapes along the passage to the treatment rooms." },
  { photo: "room-buddha", title: "Private rooms", note: "Private rooms with soft drapes and low, warm light." },
  { photo: "fountain", title: "Water feature", note: "A stone Buddha water feature, lit in warm white." },
];

/** Pinned section: vertical scroll drives a horizontal walk through the salon. */
export function WalkThrough() {
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (reduce) {
    return (
      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10">
        <p className="eyebrow">A walk through</p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {STOPS.map((s) => (
            <figure key={s.title}>
              <div className="relative aspect-[3/4]">
                <Photo name={s.photo} sizes="33vw" />
              </div>
              <figcaption className="mt-3">
                <p className="display text-2xl">{s.title}</p>
                <p className="text-sm text-mute">{s.note}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative bg-ivory" style={{ height: `calc(100vh + ${distance}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-8 flex w-full max-w-[1440px] items-end justify-between px-5 md:px-10">
          <div>
            <p className="eyebrow">A walk through</p>
            <h2 className="display mt-3 text-5xl md:text-7xl">
              Inside <em className="text-wine">Opal</em>
            </h2>
          </div>
          <div className="hidden w-48 md:block">
            <div className="h-px w-full bg-line">
              <motion.div className="h-px bg-plum" style={{ width: bar }} />
            </div>
            <p className="mt-2 text-right text-xs text-mute">Keep scrolling</p>
          </div>
        </div>
        <motion.div ref={track} style={{ x }} className="flex gap-6 pl-5 pr-[10vw] will-change-transform md:gap-10 md:pl-10">
          {STOPS.map((s, i) => (
            <figure key={s.title} className="w-[78vw] shrink-0 sm:w-[46vw] lg:w-[30vw]">
              <div className={`relative overflow-hidden ${i % 2 ? "aspect-[4/5]" : "aspect-[3/4]"}`} data-cursor="Opal">
                <Photo name={s.photo} sizes="(min-width: 1024px) 30vw, 78vw" className="transition-transform duration-[1.6s] ease-[cubic-bezier(.16,1,.3,1)] hover:scale-105" />
              </div>
              <figcaption className="mt-4 flex gap-4">
                <span className="font-display text-lg text-mute">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="display block text-2xl md:text-3xl">{s.title}</span>
                  <span className="mt-1 block max-w-xs text-sm leading-relaxed text-mute">{s.note}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
