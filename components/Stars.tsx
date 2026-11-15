import clsx from "clsx";

/** Drawn stars (the text fonts don't include the ★ glyph). Supports partial fill, e.g. 4.8. */
export function Stars({ value = 5, className }: { value?: number; className?: string }) {
  return (
    <span className={clsx("inline-flex gap-0.5", className)} aria-label={`${value} out of 5`} role="img">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i)) * 100;
        return (
          <span key={i} className="relative inline-block h-[1em] w-[1em]">
            <svg viewBox="0 0 20 20" className="absolute inset-0 h-full w-full opacity-25" aria-hidden>
              <path fill="currentColor" d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L10 15l-5.3 2.8 1.1-5.9L1.4 7.8l6-.8z" />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
              <svg viewBox="0 0 20 20" className="h-[1em] w-[1em]" aria-hidden>
                <path fill="currentColor" d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L10 15l-5.3 2.8 1.1-5.9L1.4 7.8l6-.8z" />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}
