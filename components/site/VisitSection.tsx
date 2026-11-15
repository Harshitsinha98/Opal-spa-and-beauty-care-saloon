import type { Settings } from "@/lib/settings";
import { Arrow } from "@/components/Arrow";
import { hoursText } from "@/lib/format";
import { telHref, waHref } from "@/lib/site";
import { MaskLines, Reveal } from "../motion/Reveal";
import { LazyMap } from "./LazyMap";

export function VisitSection({ s }: { s: Settings }) {
  const b = s.business;
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-28 md:px-10 md:py-40">
      <div className="grid gap-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow">Visit</p>
          <MaskLines className="display mt-4 text-5xl md:text-7xl" lines={["Arera Colony,", <em key="v" className="text-wine">Bhopal</em>]} />
          <Reveal className="mt-10 space-y-6 text-[0.95rem] leading-relaxed">
            <div>
              <p className="eyebrow mb-2">Address</p>
              <address className="not-italic">{b.address}</address>
            </div>
            <div>
              <p className="eyebrow mb-2">Hours</p>
              <p>{hoursText(s.hours)}</p>
            </div>
            {(b.phone || b.whatsapp) && (
              <div>
                <p className="eyebrow mb-2">Call or message</p>
                {b.phone && (
                  <a className="link-u block w-fit" href={telHref(b.phone)}>
                    {b.phone}
                  </a>
                )}
                {b.whatsapp && (
                  <a className="link-u block w-fit" href={waHref(b.whatsapp)} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                )}
              </div>
            )}
            <a
              href={b.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full border border-ink/20 px-6 py-3 text-sm transition-colors hover:bg-ink hover:text-paper"
            >
              Open in Google Maps <Arrow dir="out" />
            </a>
          </Reveal>
        </div>
        <div className="md:col-span-7">
          <LazyMap address={b.address} />
        </div>
      </div>
    </section>
  );
}
