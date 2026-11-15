import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { hoursText } from "@/lib/format";
import { telHref, waHref } from "@/lib/site";
import { Logo } from "../Logo";
import { Arrow } from "../Arrow";

export function Footer({ s }: { s: Settings }) {
  const b = s.business;
  const year = new Date().getFullYear();
  return (
    <footer className="px-3 pb-3 md:px-6 md:pb-6">
      <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[2rem] bg-ink text-white/80">
        <div className="dots pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative px-6 pb-8 pt-14 md:px-12 md:pt-16">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-12 md:flex-row md:items-end">
            <div>
              <p className="display max-w-xl text-4xl text-white md:text-5xl">
                Ready for your <em className="text-accent">calm hour?</em>
              </p>
              <p className="mt-3 text-white/60">Book online in under two minutes. Pay online or at the salon.</p>
            </div>
            <Link
              href="/book"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-7 py-4 font-semibold text-ink transition-colors hover:bg-accent-600"
            >
              Book a visit <Arrow />
            </Link>
          </div>

          <div className="grid gap-10 pt-12 sm:grid-cols-2 md:grid-cols-12">
            <div className="md:col-span-4">
              <Logo tone="light" />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
                Family spa and beauty care salon in Arera Colony, Bhopal. Rated {b.googleRating.toFixed(1)} from {b.googleReviewCount} Google reviews.
              </p>
            </div>
            <div className="text-sm md:col-span-3">
              <p className="font-semibold text-white">Visit</p>
              <address className="mt-4 not-italic leading-relaxed text-white/60">{b.address}</address>
              <a href={b.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-white hover:text-accent">
                Get directions <Arrow dir="out" />
              </a>
            </div>
            <div className="text-sm md:col-span-3">
              <p className="font-semibold text-white">Contact</p>
              <p className="mt-4 text-white/60">{hoursText(s.hours)}</p>
              {b.phone && (
                <a href={telHref(b.phone)} className="mt-2 block text-white hover:text-accent">
                  {b.phone}
                </a>
              )}
              {b.whatsapp && (
                <a href={waHref(b.whatsapp, "Hi Opal, I'd like to book a session.")} target="_blank" rel="noopener noreferrer" className="mt-1 block text-white hover:text-accent">
                  WhatsApp us
                </a>
              )}
              {b.email && (
                <a href={`mailto:${b.email}`} className="mt-1 block text-white hover:text-accent">
                  {b.email}
                </a>
              )}
            </div>
            <div className="text-sm md:col-span-2">
              <p className="font-semibold text-white">Explore</p>
              <ul className="mt-4 space-y-2 text-white/60">
                {[
                  ["/services", "Services"],
                  ["/book", "Book online"],
                  ["/shop", "Shop"],
                  ["/gallery", "Gallery"],
                  ["/account", "My bookings"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
                {b.instagram && (
                  <li>
                    <a href={b.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
            <p>
              © {year} {b.legalName || b.name}
            </p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal">
              <Link href="/terms" className="hover:text-white">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/cancellation-policy" className="hover:text-white">Cancellation &amp; Refunds</Link>
              <Link href="/sitemap" className="hover:text-white">Sitemap</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
