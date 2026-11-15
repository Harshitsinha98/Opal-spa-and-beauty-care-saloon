"use client";

import type { Review } from "@/lib/reviews";
import { Carousel } from "../ui/Carousel";
import { Arrow } from "../Arrow";
import { Stars } from "../Stars";

const AVATAR_TONES = ["bg-brand-50 text-brand", "bg-accent-50 text-ink", "bg-ivory text-ink"];


export function ReviewsCarousel({ reviews, rating, count, mapsUrl }: { reviews: Review[]; rating: number; count: number; mapsUrl: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand p-8 text-white lg:col-span-4">
        <div className="dots pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative flex h-full flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">Google rating</p>
          <p className="display mt-4 text-8xl">{rating.toFixed(1)}</p>
          <Stars className="mt-2 text-xl tracking-wider text-gold" value={rating} />
          <p className="mt-3 text-white/75">Based on {count} reviews from guests in Bhopal.</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 pt-3 text-sm font-semibold text-brand transition-colors hover:bg-brand-50 max-lg:mt-8"
          >
            Read all on Google <Arrow dir="out" />
          </a>
        </div>
      </div>
      <div className="min-w-0 lg:col-span-8">
        <Carousel label="Google reviews" itemClass="w-[86%] sm:w-[48%] xl:w-[48%]">
          {reviews.map((r, i) => (
            <figure key={i} className="card flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-4xl leading-none text-brand" aria-hidden>&ldquo;</span>
                <span className="flex items-center gap-1.5 text-xs text-mute">
                  <GoogleG /> {r.when}
                </span>
              </div>
              <blockquote className="mt-2 flex-1 text-[1.02rem] leading-relaxed text-ink">{r.text}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4 text-sm">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-base font-bold ${AVATAR_TONES[i % 3]}`}>
                  {r.name.trim()[0]?.toUpperCase()}
                </span>
                <span>
                  <span className="block font-semibold">{r.name}</span>
                  <span className="text-xs text-mute">{r.meta ?? "Google review"}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </Carousel>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9h-4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}
