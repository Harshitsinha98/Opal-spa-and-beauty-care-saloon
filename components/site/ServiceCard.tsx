import Image from "next/image";
import Link from "next/link";
import { durationLabel, rupees } from "@/lib/format";
import { Arrow } from "../Arrow";

export type ServiceCardData = {
  id: number;
  name: string;
  description: string;
  durationMin: number;
  price: number;
  image: string;
  category: string;
  featured?: boolean;
};

export function ServiceCard({ s }: { s: ServiceCardData }) {
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link href={`/book?service=${s.id}`} className="relative block aspect-[4/3] overflow-hidden bg-ivory" draggable={false}>
        <Image
          src={s.image}
          alt={s.name}
          fill
          sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 82vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
          draggable={false}
        />
        <div className="absolute inset-x-0 top-0 flex justify-between p-3">
          <span className="pill bg-white/90 text-ink backdrop-blur">{s.category}</span>
          {s.featured && <span className="pill bg-accent text-ink">Popular</span>}
        </div>
        <span className="pill absolute bottom-3 left-3 bg-ink/75 text-white backdrop-blur">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3l2 1.5" strokeLinecap="round" />
          </svg>
          {durationLabel(s.durationMin)}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="display text-xl">{s.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mute">{s.description}</p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <p>
            <span className="block text-[0.7rem] font-semibold uppercase tracking-wider text-mute">From</span>
            <span className="font-display text-2xl font-semibold">{rupees(s.price)}</span>
          </p>
          <Link
            href={`/book?service=${s.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand transition-colors group-hover:bg-brand group-hover:text-white"
            draggable={false}
          >
            Book <Arrow />
          </Link>
        </div>
      </div>
    </article>
  );
}
