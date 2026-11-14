"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { OpalMark } from "../Logo";

/** First-visit curtain. Shown once per browser session, skipped for reduced motion. */
export function Preloader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("opal-intro") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sessionStorage.setItem("opal-intro", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-plum text-blush"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <OpalMark className="h-14 w-auto" />
            <span className="font-display text-5xl italic">Opal</span>
            <span className="text-[0.62rem] uppercase tracking-[0.32em] opacity-70">Arera Colony · Bhopal</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
