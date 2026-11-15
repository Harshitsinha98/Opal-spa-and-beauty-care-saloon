import type { Metadata } from "next";
import Link from "next/link";
import { getMenu } from "@/lib/catalog";
import { serviceImage } from "@/lib/service-image";
import { PageHeader } from "@/components/site/PageHeader";
import { ServiceCard } from "@/components/site/ServiceCard";
import { CategoryNav } from "@/components/site/CategoryNav";
import { Reveal } from "@/components/motion/Reveal";
import { Arrow } from "@/components/Arrow";

export const metadata: Metadata = {
  title: "Services & prices",
  description: "Massages, body rituals, facials, hair, nails and grooming at Opal Spa, Arera Colony, Bhopal. Durations and prices for every treatment.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const menu = await getMenu();
  return (
    <>
      <PageHeader
        eyebrow="Services & prices"
        title={
          <>
            Every treatment, <em className="text-brand">clearly priced</em>
          </>
        }
        intro="Tap any card to book it, or combine a few on the booking page. Prices are per person."
      />
      <CategoryNav items={menu.map((c) => ({ slug: c.slug, name: c.name }))} />
      <div className="mx-auto max-w-[1280px] px-5 pb-24 md:px-8">
        {menu.map((c) => (
          <section key={c.id} id={c.slug} className="scroll-mt-40 pt-14">
            <Reveal className="mb-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
              <h2 className="display text-3xl md:text-4xl">{c.name}</h2>
              {c.blurb && <p className="text-mute">{c.blurb}</p>}
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {c.services.map((s, i) => (
                <Reveal key={s.id} delay={(i % 4) * 0.05}>
                  <ServiceCard
                    s={{
                      id: s.id,
                      name: s.name,
                      description: s.description,
                      durationMin: s.durationMin,
                      price: s.price,
                      featured: s.featured,
                      category: c.name,
                      image: serviceImage(s.image, c.slug, i),
                    }}
                  />
                </Reveal>
              ))}
            </div>
          </section>
        ))}
        {menu.length === 0 && <p className="pt-10 text-mute">The menu is being updated. Please call the salon.</p>}
        <Reveal className="card mt-20 flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="display text-2xl md:text-3xl">Not sure what to pick?</p>
            <p className="mt-1 text-mute">Book any massage and add a note. We&rsquo;ll talk it through when you arrive.</p>
          </div>
          <Link href="/book" className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-4 font-semibold text-white hover:bg-brand-700">
            Book a visit <Arrow />
          </Link>
        </Reveal>
      </div>
    </>
  );
}
