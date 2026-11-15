"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Carousel } from "../ui/Carousel";
import { ServiceCard, type ServiceCardData } from "./ServiceCard";

/** Category tabs above a swipeable row of service cards. */
export function ServicesCarousel({ services, categories }: { services: ServiceCardData[]; categories: string[] }) {
  const [cat, setCat] = useState<string>("All");
  const list = useMemo(() => (cat === "All" ? services : services.filter((s) => s.category === cat)), [cat, services]);
  return (
    <div>
      <div className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={clsx(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              cat === c ? "border-ink bg-ink text-white" : "border-line bg-white text-mute hover:text-ink",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={cat} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          <Carousel label="Services">{list.map((s) => <ServiceCard key={s.id} s={s} />)}</Carousel>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
