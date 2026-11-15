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
    if (lenis) lenis.scrollTo(el, { offset: -130 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="sticky top-[4.5rem] z-30 border-y border-line bg-paper/90 backdrop-blur-md">
      <div className="no-scrollbar mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-5 py-3 md:px-10">
        {items.map((i) => (
          <button
            key={i.slug}
            onClick={() => jump(i.slug)}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-[0.8rem] tracking-wide transition-colors",
              active === i.slug ? "bg-plum text-paper" : "text-ink/70 hover:bg-ivory",
            )}
          >
            {i.name}
          </button>
        ))}
      </div>
    </div>
  );
}
