import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getMenu, getProducts } from "@/lib/catalog";
import { REVIEWS } from "@/lib/reviews";
import { hoursText } from "@/lib/format";
import { serviceImage } from "@/lib/service-image";
import { Hero } from "@/components/site/Hero";
import { Ticker } from "@/components/site/Ticker";
import { ServicesCarousel } from "@/components/site/ServicesCarousel";
import { ProductsCarousel } from "@/components/site/ProductsCarousel";
import { ReviewsCarousel } from "@/components/site/ReviewsCarousel";
import { SectionHead } from "@/components/site/SectionHead";
import { VisitSection } from "@/components/site/VisitSection";
import { Reveal } from "@/components/motion/Reveal";
import { Photo } from "@/components/Photo";
import { Arrow } from "@/components/Arrow";

// Short phrases quoted word for word from the Google reviews in lib/reviews.ts
const QUOTES = [
  { text: "very caring and well trained therapists", who: "Azhar ali", tone: "bg-brand text-white", sub: "text-white/70" },
  { text: "Value for money, and best for relaxation.", who: "Dr Hemant Soni", tone: "bg-accent text-ink", sub: "text-ink/60" },
  { text: "staff front desk person and management all are good", who: "Muskan Khare", tone: "bg-white text-ink border border-line", sub: "text-mute" },
  { text: "very hygienic must visit", who: "Yasmeen Khan", tone: "bg-ink text-white", sub: "text-white/60" },
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
      {services.length > 0 && <Ticker items={services.slice(0, 10).map((x) => x.name)} />}

      {/* Services */}
      {services.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
          <SectionHead
            eyebrow="Services"
            title={
              <>
                Treatments for <em className="text-brand">body, skin &amp; hair</em>
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
        <SectionHead eyebrow="Why Opal" title={<>In our guests&rsquo; <em className="text-brand">own words</em></>} sub="Quoted as written in their Google reviews." />
        <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
          <Reveal className="relative min-h-80 overflow-hidden rounded-[2rem] md:col-span-2 md:row-span-2">
            <Photo name="reception" sizes="(min-width: 768px) 50vw, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white">
              <p className="display text-3xl">Shree Tower, E-7 Arera Colony</p>
              <p className="mt-2 max-w-sm text-white/75">Opposite Railway Housing Society. Massage rooms, a skin and hair station, and a lounge to wait in.</p>
            </div>
          </Reveal>
          {QUOTES.map((q, i) => (
            <Reveal key={q.who + i} delay={i * 0.06} className={`flex flex-col justify-between rounded-[2rem] p-7 ${q.tone}`}>
              <span className="display text-5xl leading-none opacity-60" aria-hidden>
                &ldquo;
              </span>
              <p className="display mt-2 text-2xl leading-tight">{q.text}</p>
              <p className={`mt-6 text-sm ${q.sub}`}>{q.who}, on Google</p>
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
                  Take your routine <em className="text-brand">home</em>
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
        <SectionHead eyebrow="Reviews" title={<>What guests say <em className="text-brand">on Google</em></>} />
        <ReviewsCarousel reviews={REVIEWS} rating={s.business.googleRating} count={s.business.googleReviewCount} mapsUrl={s.business.mapsUrl} />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1280px] px-5 pb-20 md:px-8 md:pb-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink text-white">
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display font-bold text-ink">{i + 1}</span>
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
          title={<>Take a look <em className="text-brand">inside</em></>}
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
