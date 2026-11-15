import clsx from "clsx";

/** Opal stone mark: an oval with a highlight arc, like light catching a polished cabochon. */
export function OpalMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" aria-hidden className={clsx("shrink-0", className)}>
      <ellipse cx="20" cy="24" rx="17" ry="21.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <ellipse cx="20" cy="24" rx="11.5" ry="15.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      <path d="M9.5 17.5c3.8-6.4 17.2-6.4 21 0" fill="none" stroke="#b47c76" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", tone === "light" ? "text-paper" : "text-ink", className)}>
      <OpalMark className="h-8 w-auto" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.65rem] font-medium tracking-[0.02em]">Opal</span>
        <span className="mt-0.5 text-[0.56rem] uppercase tracking-[0.26em] opacity-70">Spa &amp; Beauty Care</span>
      </span>
    </span>
  );
}
