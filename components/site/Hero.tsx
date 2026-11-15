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
    <section className="wash relative overflow-hidden">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-40 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <motion.a href="#reviews" {...up(0.05)} className="pill border border-line bg-white text-ink shadow-sm">
            <Stars value={rating} className="text-gold" />
            <span>
              {rating.toFixed(1)} · {count} Google reviews
            </span>
          </motion.a>
          <motion.h1 {...up(0.12)} className="display mt-6 text-[2.9rem] sm:text-6xl lg:text-[4.6rem]">
            Massage, skin &amp; hair care, <em className="text-accent">booked in seconds.</em>
          </motion.h1>
          <motion.p {...up(0.2)} className="mt-6 max-w-lg text-lg leading-relaxed text-mute">
            Opal Spa &amp; Beauty Care Salon in Arera Colony, Bhopal. Pick a treatment, choose a time, and pay online or at the salon.
          </motion.p>
          <motion.div {...up(0.28)} className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/book" className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-4 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(13,94,82,0.7)] transition-colors hover:bg-brand-700">
              Book a visit <Arrow />
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-7 py-4 font-semibold text-ink transition-colors hover:border-ink">
              View services
            </Link>
          </motion.div>
          <motion.ul {...up(0.36)} className="mt-10 grid max-w-lg gap-2 text-sm sm:grid-cols-3 sm:gap-3">
            {[
              ["Open daily", hours.replace(/^Open (daily, )?/, "")],
              ["Private rooms", "Spacious and well kept"],
              ["Pay your way", "UPI, card or cash"],
            ].map(([t, d]) => (
              <li key={t} className="flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3 backdrop-blur sm:block sm:p-3.5">
                <p className="font-semibold text-ink">{t}</p>
                <p className="text-right text-xs leading-snug text-mute sm:mt-0.5 sm:text-left">{d}</p>
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="relative lg:col-span-6">
          <div className="grid grid-cols-5 grid-rows-6 gap-3 md:gap-4" style={{ height: "min(78vh, 640px)" }}>
            <motion.div
              className="relative col-span-3 row-span-6 overflow-hidden rounded-[2rem] bg-sand shadow-[var(--shadow-lift)]"
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
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
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-5 pt-16 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Inside Opal</p>
                <p className="display mt-1 text-xl">Reception &amp; lounge</p>
              </div>
            </motion.div>
            <motion.div
              className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.6rem] bg-sand"
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.25 }}
            >
              <Image src={room.src} alt={room.alt} fill sizes="20vw" priority placeholder="blur" blurDataURL={room.blurDataURL} className="object-cover" />
            </motion.div>
            <motion.div
              className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.6rem] bg-sand"
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.35 }}
            >
              <Image src={lounge.src} alt={lounge.alt} fill sizes="20vw" placeholder="blur" blurDataURL={lounge.blurDataURL} className="object-cover" />
            </motion.div>
          </div>

          <motion.div
            className="absolute -left-3 top-10 hidden items-center gap-3 rounded-2xl border border-line bg-white/95 p-3 pr-5 shadow-[var(--shadow-lift)] backdrop-blur sm:flex md:-left-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0, y: reduce ? 0 : [0, -8, 0] }}
            transition={{ opacity: { delay: 0.7, duration: 0.6 }, x: { delay: 0.7, duration: 0.6 }, y: { delay: 1.4, duration: 5, repeat: Infinity, ease: "easeInOut" } }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="text-sm">
              <span className="block font-semibold">Clean &amp; hygienic</span>
              <span className="text-xs text-mute">Guests say it most</span>
            </span>
          </motion.div>

          <motion.div
            className="absolute -bottom-4 right-4 flex items-center gap-3 rounded-2xl bg-ink p-3 pr-5 text-white shadow-[var(--shadow-lift)] md:-right-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: reduce ? 0 : [0, 8, 0] }}
            transition={{ opacity: { delay: 0.85, duration: 0.6 }, y: { delay: 1.5, duration: 6, repeat: Infinity, ease: "easeInOut" } }}
          >
            <span className="display flex h-10 w-12 items-center justify-center rounded-xl bg-accent text-lg">{rating.toFixed(1)}</span>
            <span className="text-sm">
              <span className="block font-semibold">Loved on Google</span>
              <span className="text-xs text-white/60">{count} reviews</span>
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
