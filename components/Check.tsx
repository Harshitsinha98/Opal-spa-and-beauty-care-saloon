import clsx from "clsx";

/** Drawn tick (the text fonts don't include the check-mark glyph). */
export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("inline-block h-[1em] w-[1em]", className)} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}
