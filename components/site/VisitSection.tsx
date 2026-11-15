import type { Settings } from "@/lib/settings";
import { hoursText } from "@/lib/format";
import { telHref, waHref } from "@/lib/site";
import { Reveal } from "../motion/Reveal";
import { LazyMap } from "./LazyMap";
import { Arrow } from "../Arrow";

export function VisitSection({ s }: { s: Settings }) {
  const b = s.business;
  const rows: { label: string; body: React.ReactNode }[] = [
    { label: "Address", body: <address className="not-italic">{b.address}</address> },
    { label: "Hours", body: hoursText(s.hours) },
  ];
  if (b.phone || b.whatsapp)
    rows.push({
      label: "Call or message",
      body: (
        <span className="flex flex-wrap gap-x-4">
          {b.phone && (
            <a className="link-u" href={telHref(b.phone)}>
              {b.phone}
            </a>
          )}
          {b.whatsapp && (
            <a className="link-u" href={waHref(b.whatsapp)} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          )}
        </span>
      ),
    });
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
      <div className="card grid overflow-hidden p-2 lg:grid-cols-12">
        <Reveal className="p-6 md:p-10 lg:col-span-5">
          <p className="eyebrow">Visit us</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">
            Arera Colony, <em className="text-brand">Bhopal</em>
          </h2>
          <dl className="mt-8 space-y-5">
            {rows.map((r) => (
              <div key={r.label} className="rounded-2xl bg-ivory/70 p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-mute">{r.label}</dt>
                <dd className="mt-1 leading-relaxed">{r.body}</dd>
              </div>
            ))}
          </dl>
          <a
            href={b.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
          >
            Open in Google Maps <Arrow dir="out" />
          </a>
        </Reveal>
        <div className="overflow-hidden rounded-[1.4rem] lg:col-span-7">
          <LazyMap address={b.address} />
        </div>
      </div>
    </section>
  );
}
