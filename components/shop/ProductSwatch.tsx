/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";

/**
 * Product image, or when the salon hasn't uploaded one, a drawn bottle in the
 * product's own colour so the shop never shows stock photos or empty boxes.
 */
export function ProductSwatch({ name, tone, image, small }: { name: string; tone: string; image: string | null; small?: boolean }) {
  if (image) {
    return <img src={image} alt={name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />;
  }
  return (
    <div className="absolute inset-0 flex items-end justify-center" style={{ background: `linear-gradient(180deg, #f4ede5 0%, ${tone}33 100%)` }}>
      <svg viewBox="0 0 120 200" className={clsx("w-auto", small ? "h-[80%]" : "h-[72%]")} aria-hidden>
        <rect x="47" y="8" width="26" height="22" rx="3" fill="#2a1a20" />
        <rect x="42" y="28" width="36" height="10" rx="2" fill="#3b2a30" />
        <path d="M30 60c0-14 10-22 30-22s30 8 30 22v122c0 7-5 12-12 12H42c-7 0-12-5-12-12z" fill={tone} />
        <path d="M30 60c0-14 10-22 30-22s30 8 30 22v122c0 7-5 12-12 12H42c-7 0-12-5-12-12z" fill="url(#shine)" />
        <rect x="38" y="96" width="44" height="58" fill="#fbf8f4" opacity="0.92" />
        {!small && (
          <>
            <text x="60" y="120" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fontStyle="italic" fill="#3b1d29">Opal</text>
            <line x1="48" x2="72" y1="130" y2="130" stroke="#b47c76" strokeWidth="1" />
          </>
        )}
        <defs>
          <linearGradient id="shine" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.12" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
