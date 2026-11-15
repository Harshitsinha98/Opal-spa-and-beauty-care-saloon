"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Arrow } from "../Arrow";

/**
 * Horizontal card carousel built on native scroll-snap: touch swipe and trackpads
 * work out of the box, mouse users can drag, and the arrow buttons page by one card.
 */
export function Carousel({
  children,
  label,
  itemClass = "w-[82%] sm:w-[46%] lg:w-[31%] xl:w-[23.5%]",
  className,
  controls = "bottom",
}: {
  children: ReactNode[];
  label: string;
  itemClass?: string;
  className?: string;
  controls?: "bottom" | "none";
}) {
  const track = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [progress, setProgress] = useState(0);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    setProgress(max > 0 ? el.scrollLeft / max : 1);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, children.length]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    const step = first ? first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0") : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  // Mouse drag (touch uses native scrolling)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = track.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5 && !d.moved) {
      d.moved = true;
      el.style.scrollSnapType = "none";
      el.setPointerCapture(e.pointerId);
    }
    if (d.moved) el.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    const el = track.current;
    if (el) el.style.scrollSnapType = "";
    setTimeout(() => (drag.current = null), 0);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current?.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className={className} role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        data-lenis-prevent-horizontal
       
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-6 pt-1 md:-mx-8 md:gap-5 md:scroll-px-8 md:px-8"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        {children.map((c, i) => (
          <div key={i} className={clsx("shrink-0 snap-start", itemClass)}>
            {c}
          </div>
        ))}
      </div>
      {controls === "bottom" && (
        <div className="mt-2 flex items-center gap-4">
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-line">
            <div className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-300" style={{ width: `${Math.max(12, progress * 100)}%` }} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => page(-1)}
              disabled={!canPrev}
              aria-label="Previous"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink transition-all hover:border-brand hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-35"
            >
              <Arrow dir="left" />
            </button>
            <button
              onClick={() => page(1)}
              disabled={!canNext}
              aria-label="Next"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink transition-all hover:border-brand hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-35"
            >
              <Arrow />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
