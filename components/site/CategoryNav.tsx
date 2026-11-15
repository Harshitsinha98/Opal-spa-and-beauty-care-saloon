"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { getLenis } from "../motion/SmoothScroll";

export function CategoryNav({ items }: { items: { slug: string; name: string }[] }) {
  const [active, setActive] = useState(items[0]?.slug);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.slug);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  const jump = (slug: string) => {
    const el = document.getElementById(slug);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -160 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="sticky top-[5.6rem] z-30 px-5 md:top-[6rem] md:px-8">
      <div className="no-scrollbar mx-auto flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-white/90 p-1.5 shadow-[var(--shadow-card)] backdrop-blur-xl">
        {items.map((i) => (
          <button
            key={i.slug}
            onClick={() => jump(i.slug)}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              active === i.slug ? "bg-ink text-white" : "text-mute hover:text-ink",
            )}
          >
            {i.name}
          </button>
        ))}
      </div>
    </div>
  );
}
