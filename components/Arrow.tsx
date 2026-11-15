import clsx from "clsx";

const PATHS = {
  right: "M3 8h10M9 4l4 4-4 4",
  left: "M13 8H3M7 4L3 8l4 4",
  out: "M5 11l6-6M6 5h5v5",
};

/** Drawn arrow (the text fonts don't include arrow glyphs). */
export function Arrow({ dir = "right", className }: { dir?: keyof typeof PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={clsx("inline-block h-[0.9em] w-[0.9em] align-[-0.1em]", className)} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[dir]} />
    </svg>
  );
}
