import type { Metadata } from "next";
import Link from "next/link";
import { getMenu } from "@/lib/catalog";
import { PageHeader } from "@/components/site/PageHeader";
import { MenuList } from "@/components/site/MenuList";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryNav } from "@/components/site/CategoryNav";

export const metadata: Metadata = {
  title: "Menu & prices",
  description: "Massages, body rituals, facials, hair, nails and grooming at Opal Spa, Arera Colony, Bhopal. Durations and prices for every treatment.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const menu = await getMenu();
  let counter = 1;
  return (
    <>
      <PageHeader
        eyebrow="Menu & prices"
        lines={["Treatments,", <em key="t" className="text-wine">by the hour</em>]}
        intro="Tap any treatment to book it, or combine a few on the booking page. Prices are per person."
      />
      <CategoryNav items={menu.map((c) => ({ slug: c.slug, name: c.name }))} />
      <div className="mx-auto max-w-[1440px] px-5 pb-32 md:px-10">
        {menu.map((c) => {
          const start = counter;
          counter += c.services.length;
          return (
            <section key={c.id} id={c.slug} className="scroll-mt-40 pt-20">
              <div className="mb-8 grid gap-4 md:grid-cols-12">
                <Reveal className="md:col-span-5">
                  <h2 className="display text-5xl md:text-6xl">{c.name}</h2>
                </Reveal>
                {c.blurb && (
                  <Reveal delay={0.1} className="text-sm leading-relaxed text-mute md:col-span-4 md:col-start-9 md:self-end">
                    {c.blurb}
                  </Reveal>
                )}
              </div>
              <MenuList start={start} items={c.services.map((s) => ({ ...s, category: c.name }))} />
            </section>
          );
        })}
        {menu.length === 0 && <p className="text-mute">The menu is being updated. Please call the salon.</p>}
        <Reveal className="mt-24 flex flex-col items-start gap-6 border-t border-line pt-12 md:flex-row md:items-center md:justify-between">
          <p className="display max-w-xl text-3xl md:text-4xl">Not sure what to pick? Book any massage and add a note. We'll talk it through when you arrive.</p>
          <Link href="/book" className="rounded-full bg-plum px-7 py-4 text-sm text-paper transition-colors hover:bg-wine">
            Book a visit
          </Link>
        </Reveal>
      </div>
    </>
  );
}
