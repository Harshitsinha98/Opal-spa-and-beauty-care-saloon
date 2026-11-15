/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";

/**
 * Product photo, or when the salon hasn't uploaded one, a drawn bottle in the
 * product's own colour so the shop never shows stock photos or empty boxes.
 */
export function ProductSwatch({ name, tone, image, small }: { name: string; tone: string; image: string | null; small?: boolean }) {
  if (image) {
    return <img src={image} alt={name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" draggable={false} />;
  }
  return (
    <div className="absolute inset-0 flex items-end justify-center" style={{ background: `radial-gradient(80% 70% at 50% 85%, ${tone}55, transparent 70%), linear-gradient(180deg, #f3f1eb, ${tone}26)` }}>
      <svg viewBox="0 0 120 200" className={clsx("w-auto drop-shadow-[0_18px_18px_rgba(15,31,27,0.18)]", small ? "h-[80%]" : "h-[70%]")} aria-hidden>
        <rect x="46" y="8" width="28" height="22" rx="5" fill="#0f1f1b" />
        <rect x="41" y="28" width="38" height="10" rx="3" fill="#24332f" />
        <path d="M28 62c0-15 11-24 32-24s32 9 32 24v118c0 8-6 14-14 14H42c-8 0-14-6-14-14z" fill={tone} />
        <path d="M28 62c0-15 11-24 32-24s32 9 32 24v118c0 8-6 14-14 14H42c-8 0-14-6-14-14z" fill="url(#shine)" />
        <rect x="38" y="96" width="44" height="56" rx="6" fill="#ffffff" opacity="0.95" />
        {!small && (
          <>
            <text x="60" y="122" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="13" letterSpacing="-0.5" fill="#d6336c">opal</text>
            <rect x="52" y="130" width="16" height="2.5" rx="1.25" fill="#ffb020" />
          </>
        )}
        <defs>
          <linearGradient id="shine" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.12" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
