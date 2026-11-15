"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { VIDEO, photoMeta } from "../Photo";
import { Arrow } from "../Arrow";
import { Stars } from "../Stars";

const EASE = [0.16, 1, 0.3, 1] as const;
const up = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: EASE, delay },
});

export function Hero({ rating, count, hours }: { rating: number; count: number; hours: string }) {
  const reduce = useReducedMotion();
  const room = photoMeta("room-buddha");
  const lounge = photoMeta("lounge");
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-40 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <motion.a href="#reviews" {...up(0.05)} className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <Stars value={rating} className="text-gold" />
            <span>
              {rating.toFixed(1)} on Google <span className="font-normal text-mute">· {count} reviews</span>
            </span>
          </motion.a>
          <motion.h1 {...up(0.12)} className="display mt-6 text-[2.9rem] sm:text-6xl lg:text-[4.7rem]">
            Massage, skin &amp; hair care in <span className="mark">Arera&nbsp;Colony</span>
          </motion.h1>
          <motion.p {...up(0.2)} className="mt-6 max-w-lg text-lg leading-relaxed text-mute">
            Opal Spa &amp; Beauty Care Salon, Bhopal. Pick a treatment, choose a time that suits you, and pay online or at the salon.
          </motion.p>
          <motion.div {...up(0.28)} className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/book" className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-4 font-semibold text-white transition-colors hover:bg-brand-700">
              Book a visit <Arrow />
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-7 py-[0.9rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-white">
              See prices
            </Link>
          </motion.div>
          <motion.p {...up(0.36)} className="mt-10 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-6 text-sm text-mute">
            <span>{hours}</span>
            <span aria-hidden className="text-line">|</span>
            <span>Shree Tower, E-7</span>
            <span aria-hidden className="text-line">|</span>
            <span>UPI, card or cash</span>
          </motion.p>
        </div>

        <div className="relative lg:col-span-6">
          {/* Solid colour block behind the photos */}
          <motion.div
            aria-hidden
            className="absolute -bottom-6 -right-6 left-10 top-10 rounded-[2.5rem] bg-brand md:-right-8"
            initial={reduce ? false : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, ease: EASE }}
          />
          <motion.div
            aria-hidden
            className="absolute -left-3 top-24 h-24 w-24 rounded-full bg-accent md:-left-6"
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
          />
          <div className="relative grid grid-cols-5 grid-rows-6 gap-3 md:gap-4" style={{ height: "min(74vh, 600px)" }}>
            <motion.div
              className="relative col-span-3 row-span-6 overflow-hidden rounded-[2rem] bg-sand"
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
            >
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={VIDEO.src}
                poster={VIDEO.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="A slow pan across the Opal reception and lounge"
              />
            </motion.div>
            <motion.div
              className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.6rem] bg-sand"
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.22 }}
            >
              <Image src={room.src} alt={room.alt} fill sizes="20vw" priority placeholder="blur" blurDataURL={room.blurDataURL} className="object-cover" />
            </motion.div>
            <motion.div
              className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.6rem] bg-sand"
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.32 }}
            >
              <Image src={lounge.src} alt={lounge.alt} fill sizes="20vw" placeholder="blur" blurDataURL={lounge.blurDataURL} className="object-cover" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
