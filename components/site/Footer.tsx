import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import type { Settings } from "@/lib/settings";
import { hoursText } from "@/lib/format";
import { telHref, waHref } from "@/lib/site";
import { OpalMark } from "../Logo";

export function Footer({ s }: { s: Settings }) {
  const b = s.business;
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-plum text-blush">
      <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-24 md:px-10">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="display text-[2.6rem] text-paper md:text-[3.4rem]">
              Come in tired.
              <br />
              <em className="text-rose">Leave lighter.</em>
            </p>
            <Link
              href="/book"
              className="mt-8 inline-flex items-center gap-3 rounded-full border border-blush/40 px-6 py-3 text-sm text-paper transition-colors hover:bg-paper hover:text-plum"
            >
              Book a visit <Arrow />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm md:col-span-7 md:grid-cols-3">
            <div>
              <p className="eyebrow !text-blush/60">Visit</p>
              <address className="mt-4 not-italic leading-relaxed text-blush/90">{b.address}</address>
              <a href={b.mapsUrl} target="_blank" rel="noopener noreferrer" className="link-u mt-3 inline-block text-paper">
                Get directions
              </a>
            </div>
            <div>
              <p className="eyebrow !text-blush/60">Hours</p>
              <p className="mt-4 leading-relaxed text-blush/90">{hoursText(s.hours)}</p>
              {b.phone && (
                <a href={telHref(b.phone)} className="link-u mt-3 block text-paper">
                  {b.phone}
                </a>
              )}
              {b.whatsapp && (
                <a href={waHref(b.whatsapp, "Hi Opal, I'd like to book a session.")} target="_blank" rel="noopener noreferrer" className="link-u mt-1 block text-paper">
                  WhatsApp us
                </a>
              )}
              {b.email && (
                <a href={`mailto:${b.email}`} className="link-u mt-1 block text-paper">
                  {b.email}
                </a>
              )}
            </div>
            <div>
              <p className="eyebrow !text-blush/60">Explore</p>
              <ul className="mt-4 space-y-2 text-blush/90">
                {[
                  ["/services", "Menu & prices"],
                  ["/book", "Book online"],
                  ["/shop", "Shop (pickup)"],
                  ["/gallery", "The house"],
                  ["/contact", "Contact"],
                  ["/account", "My bookings"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="link-u hover:text-paper">
                      {label}
                    </Link>
                  </li>
                ))}
                {b.instagram && (
                  <li>
                    <a href={b.instagram} target="_blank" rel="noopener noreferrer" className="link-u hover:text-paper">
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="pointer-events-none mt-20 select-none" aria-hidden>
          <p className="display flex items-end gap-4 text-[26vw] leading-[0.78] text-paper/[0.07] md:text-[19vw]">
            Opal <OpalMark className="mb-[3vw] h-[14vw] w-auto text-paper/10" />
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-blush/15 pt-6 text-xs text-blush/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {b.legalName || b.name}. Arera Colony, Bhopal.
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal">
            <Link href="/terms" className="hover:text-paper">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-paper">Privacy Policy</Link>
            <Link href="/cancellation-policy" className="hover:text-paper">Cancellation &amp; Refunds</Link>
            <Link href="/sitemap" className="hover:text-paper">Sitemap</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
