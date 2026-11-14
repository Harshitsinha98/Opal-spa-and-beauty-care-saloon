"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { MaskLines } from "../motion/Reveal";
import { VIDEO } from "../Photo";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero({ rating, count, hours }: { rating: number; count: number; hours: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "18%"]);
  const videoScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "-30%"]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-28 md:pt-32">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-20 md:grid-cols-12 md:px-10 md:pb-28">
        <motion.div style={{ y: textY }} className="flex flex-col justify-end md:col-span-7 md:pb-10">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
          >
            Family spa &amp; beauty care · Arera Colony, Bhopal
          </motion.p>
          <MaskLines
            as="h1"
            immediate
            delay={0.3}
            className="display mt-6 text-[3.6rem] sm:text-[5rem] lg:text-[7.2rem]"
            lines={[
              "Quiet rooms,",
              "warm oil,",
              <em key="e" className="text-wine">
                unhurried hands.
              </em>,
            ]}
          />
          <motion.div
            className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.85 }}
          >
            <p className="max-w-sm text-[0.98rem] leading-relaxed text-ink/75">
              Massages, body rituals, facials, hair and nail care at Opal Spa &amp; Beauty Care Salon. {hours}.
            </p>
            <div className="flex shrink-0 items-center gap-5">
              <Link
                href="/book"
                className="group relative overflow-hidden rounded-full bg-plum px-7 py-4 text-sm tracking-wide text-paper"
              >
                <span className="relative z-10">Book a visit</span>
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-wine transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-y-100" />
              </Link>
              <Link href="/services" className="link-u text-sm">
                See the menu
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <div className="relative md:col-span-5">
          <motion.div
            className="arch relative mx-auto aspect-[3/4.2] w-full max-w-[30rem] overflow-hidden bg-sand"
            initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0 0)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 999px 999px 0 0)" }}
            transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
          >
            <motion.video
              style={{ y: videoY, scale: videoScale }}
              className="absolute inset-0 h-[115%] w-full object-cover"
              src={VIDEO.src}
              poster={VIDEO.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="A slow pan across the Opal reception and lounge"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-plum/35 via-transparent to-transparent" />
          </motion.div>

          <motion.a
            href="#reviews"
            className="absolute -right-1 bottom-8 flex items-center gap-4 bg-paper px-5 py-4 shadow-[0_20px_50px_-20px_rgba(59,29,41,0.35)] md:-right-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 1.2 }}
          >
            <span className="display text-4xl text-plum">{rating.toFixed(1)}</span>
            <span className="text-xs leading-snug text-mute">
              <span className="block text-brass">★★★★★</span>
              {count} Google reviews
            </span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
