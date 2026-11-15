import clsx from "clsx";

/** Opal mark: a polished stone (oval) with a highlight, on a rounded jade tile. */
export function OpalMark({ className, plain }: { className?: string; plain?: boolean }) {
  if (plain) {
    return (
      <svg viewBox="0 0 40 48" aria-hidden className={clsx("shrink-0", className)}>
        <ellipse cx="20" cy="24" rx="16" ry="20" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M10.5 17.5c3.6-6 15.4-6 19 0" fill="none" stroke="#ffb020" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={clsx("shrink-0", className)}>
      <rect width="40" height="40" rx="12" fill="#d6336c" />
      <ellipse cx="20" cy="21" rx="9.5" ry="12" fill="none" stroke="#fff" strokeWidth="2.6" />
      <path d="M14.2 16.6c2.2-3.6 9.4-3.6 11.6 0" fill="none" stroke="#ffb020" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", tone === "light" ? "text-white" : "text-ink", className)}>
      <OpalMark className="h-9 w-9" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] font-bold tracking-[-0.04em]">opal</span>
        <span className="mt-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] opacity-60">Spa &amp; Beauty Care</span>
      </span>
    </span>
  );
}
