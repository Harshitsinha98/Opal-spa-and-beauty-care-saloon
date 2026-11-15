import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getMenu, getProducts } from "@/lib/catalog";
import { REVIEWS } from "@/lib/reviews";
import { hoursText } from "@/lib/format";
import { serviceImage } from "@/lib/service-image";
import { Hero } from "@/components/site/Hero";
import { ServicesCarousel } from "@/components/site/ServicesCarousel";
import { ProductsCarousel } from "@/components/site/ProductsCarousel";
import { ReviewsCarousel } from "@/components/site/ReviewsCarousel";
import { SectionHead } from "@/components/site/SectionHead";
import { VisitSection } from "@/components/site/VisitSection";
import { Reveal } from "@/components/motion/Reveal";
import { Photo } from "@/components/Photo";
import { Arrow } from "@/components/Arrow";

const FEATURES = [
  { title: "Clean & hygienic", text: "The word guests use most in their Google reviews.", icon: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M9 12l2 2 4-4" },
  { title: "Trained therapists", text: "Reviewers call the team caring, professional and well mannered.", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0" },
  { title: "Value for money", text: "Clear prices on every treatment, before you book.", icon: "M4 7h16v10H4z M12 12m-2.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0" },
  { title: "Book in 2 minutes", text: "Live slots, instant confirmation, cancel from your account.", icon: "M5 5h14v15H5z M5 9h14 M9 3v4 M15 3v4" },
];

export default async function HomePage() {
  const [s, menu, products] = await Promise.all([getSettings(), getMenu(), getProducts()]);
  const services = menu.flatMap((c) =>
    c.services.map((x, i) => ({
      id: x.id,
      name: x.name,
      description: x.description,
      durationMin: x.durationMin,
      price: x.price,
      featured: x.featured,
      category: c.name,
      image: serviceImage(x.image, c.slug, i),
    })),
  );
  // Popular treatments first
  services.sort((a, b) => Number(b.featured) - Number(a.featured));

  return (
    <>
      <Hero rating={s.business.googleRating} count={s.business.googleReviewCount} hours={hoursText(s.hours)} />

      {/* Services */}
      {services.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
          <SectionHead
            eyebrow="Services"
            title={
              <>
                Treatments for <em className="text-accent">body, skin &amp; hair</em>
              </>
            }
            sub="Clear prices and durations. Tap any card to book it."
            action={
              <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold hover:border-ink">
                All services <Arrow />
              </Link>
            }
          />
          <ServicesCarousel services={services} categories={menu.map((c) => c.name)} />
        </section>
      )}

      {/* Why Opal: bento */}
      <section className="mx-auto max-w-[1280px] px-5 pb-20 md:px-8 md:pb-28">
        <SectionHead eyebrow="Why Opal" title={<>A calm place, <em className="text-accent">run with care</em></>} />
        <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
          <Reveal className="relative min-h-80 overflow-hidden rounded-[2rem] md:col-span-2 md:row-span-2">
            <Photo name="reception" sizes="(min-width: 768px) 50vw, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white">
              <p className="display text-3xl">Shree Tower, E-7 Arera Colony</p>
              <p className="mt-2 max-w-sm text-white/75">Opposite Railway Housing Society. Massage rooms, a skin and hair station, and a lounge to wait in.</p>
            </div>
          </Reveal>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06} className={i === 1 ? "card bg-accent-50 p-6" : i === 2 ? "card bg-brand-50 p-6" : "card p-6"}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${i === 1 ? "bg-accent text-white" : "bg-brand text-white"}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {f.icon.split(" M").map((d, k) => (
                    <path key={k} d={k ? `M${d}` : d} />
                  ))}
                </svg>
              </span>
              <p className="display mt-5 text-xl">{f.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-mute">{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Shop */}
      {products.length > 0 && (
        <section className="bg-ivory">
          <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
            <SectionHead
              eyebrow="Shop · pickup at the salon"
              title={
                <>
                  Take your routine <em className="text-accent">home</em>
                </>
              }
              sub="Order online, pick up from the front desk. Pay online or at pickup."
              action={
                <Link href="/shop" className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold hover:border-ink">
                  Visit shop <Arrow />
                </Link>
              }
            />
            <ProductsCarousel
              products={products.map((p) => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                description: p.description,
                size: p.size,
                price: p.price,
                stock: p.stock,
                image: p.image,
                tone: p.tone,
              }))}
            />
          </div>
        </section>
      )}

      {/* Reviews */}
      <section id="reviews" className="mx-auto max-w-[1280px] scroll-mt-28 px-5 py-20 md:px-8 md:py-28">
        <SectionHead eyebrow="Reviews" title={<>What guests say <em className="text-accent">on Google</em></>} />
        <ReviewsCarousel reviews={REVIEWS} rating={s.business.googleRating} count={s.business.googleReviewCount} mapsUrl={s.business.mapsUrl} />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1280px] px-5 pb-20 md:px-8 md:pb-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand text-white">
          <div className="dots pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="relative grid gap-10 p-8 md:p-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">How booking works</p>
              <h2 className="display mt-3 text-4xl md:text-5xl">
                Three steps. <em className="text-accent">No phone calls.</em>
              </h2>
              <p className="mt-4 max-w-md text-white/75">
                {s.cancellation.freeWindowHours > 0
                  ? `Plans change. Cancel up to ${s.cancellation.freeWindowHours} hours before for a full refund.`
                  : "Plans change. Cancel any time from your account."}
              </p>
              <Link href="/book" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-semibold text-brand transition-colors hover:bg-brand-50">
                Start booking <Arrow />
              </Link>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
              {[
                ["Choose", "One treatment or a few together."],
                ["Pick a time", `Live slots for the next ${s.booking.advanceDays} days.`],
                ["Pay your way", s.payments.cashEnabled ? "Online now, or at the salon." : "UPI, card or net banking."],
              ].map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 0.08} className="rounded-3xl bg-white/10 p-6 backdrop-blur">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display font-bold">{i + 1}</span>
                  <p className="display mt-6 text-2xl">{t}</p>
                  <p className="mt-1.5 text-sm text-white/70">{d}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Gallery teaser */}
      <section className="mx-auto max-w-[1280px] px-5 pb-8 md:px-8">
        <SectionHead
          eyebrow="Gallery"
          title={<>Take a look <em className="text-accent">inside</em></>}
          action={
            <Link href="/gallery" className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold hover:border-ink">
              Full gallery <Arrow />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {(["lounge-tall", "room-wine", "entrance-sign", "corridor"] as const).map((n, i) => (
            <Reveal key={n} delay={i * 0.06} className={`relative overflow-hidden rounded-3xl ${i % 2 ? "aspect-[3/4] md:mt-10" : "aspect-[3/4]"}`}>
              <Photo name={n} sizes="(min-width: 768px) 25vw, 50vw" className="transition-transform duration-700 hover:scale-105" />
            </Reveal>
          ))}
        </div>
      </section>

      <VisitSection s={s} />
    </>
  );
}
