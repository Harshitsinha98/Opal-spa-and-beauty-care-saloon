import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { getSettings } from "@/lib/settings";
import { getFeaturedServices, getMenu } from "@/lib/catalog";
import { REVIEWS } from "@/lib/reviews";
import { hoursText, hhmmToMinutes, minutesToLabel } from "@/lib/format";

const shortTime = (hhmm: string) => minutesToLabel(hhmmToMinutes(hhmm)).replace(":00", "").replace(" ", "");
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { MenuList } from "@/components/site/MenuList";
import { WalkThrough } from "@/components/site/WalkThrough";
import { ReviewsCarousel } from "@/components/site/ReviewsCarousel";
import { ClipReveal, MaskLines, Parallax, Reveal, ScrubWords } from "@/components/motion/Reveal";
import { Photo } from "@/components/Photo";
import { VisitSection } from "@/components/site/VisitSection";

export default async function HomePage() {
  const [s, featured, menu] = await Promise.all([getSettings(), getFeaturedServices(6), getMenu()]);
  const marquee = menu.flatMap((c) => c.services.map((x) => x.name)).slice(0, 12);
  const c = s.cancellation;

  return (
    <>
      <Hero rating={s.business.googleRating} count={s.business.googleReviewCount} hours={hoursText(s.hours)} />

      {marquee.length > 0 && <Marquee items={marquee} />}

      {/* The house */}
      <section className="mx-auto max-w-[1440px] px-5 py-28 md:px-10 md:py-40">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-3">
            <Reveal>
              <p className="eyebrow">The house</p>
            </Reveal>
          </div>
          <div className="md:col-span-9">
            <ScrubWords
              className="display text-[2.1rem] leading-[1.15] md:text-[3.6rem]"
              text="Opal is a family spa in Shree Tower, Arera Colony. Past the glass doors there is a velvet lounge, a brass Buddha and fresh flowers by the front desk. Further in, private rooms are set up for massages, scrubs and facials."
            />
          </div>
        </div>

        <div className="mt-24 grid grid-cols-12 gap-4 md:mt-32 md:gap-8">
          <div className="col-span-7 md:col-span-6">
            <ClipReveal className="relative aspect-[4/3]">
              <Photo name="lounge" sizes="(min-width: 768px) 50vw, 60vw" />
            </ClipReveal>
            <Reveal className="mt-4 text-sm text-mute">The lounge, by the front desk.</Reveal>
          </div>
          <div className="col-span-5 mt-24 md:col-span-3 md:col-start-8 md:mt-40">
            <Parallax offset={50}>
              <ClipReveal className="relative aspect-[3/5]" delay={0.15}>
                <Photo name="fountain" sizes="(min-width: 768px) 25vw, 40vw" />
              </ClipReveal>
            </Parallax>
          </div>
          <div className="col-span-12 mt-8 md:col-span-2 md:mt-auto">
            <Reveal className="text-sm leading-relaxed text-mute">
              Guests on Google keep using the same words: clean, hygienic, relaxing, and good, caring staff.
            </Reveal>
          </div>
        </div>
      </section>

      {/* Featured menu */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pb-28 md:px-10 md:pb-40">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Reveal>
                <p className="eyebrow">Most booked</p>
              </Reveal>
              <MaskLines className="display mt-4 text-5xl md:text-7xl" lines={["From the", <em key="m" className="text-wine">menu</em>]} />
            </div>
            <Reveal>
              <Link href="/services" className="link-u text-sm">
                Full menu and prices <Arrow />
              </Link>
            </Reveal>
          </div>
          <MenuList items={featured.map((f) => ({ ...f }))} />
        </section>
      )}

      <WalkThrough />

      {/* Numbers */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 md:grid-cols-4">
          {[
            [s.business.googleRating.toFixed(1), "Average Google rating"],
            [String(s.business.googleReviewCount), "Reviews from guests"],
            [s.hours.closedWeekdays.length ? String(7 - s.hours.closedWeekdays.length) : "7", "Days a week"],
            [`${shortTime(s.hours.open)}–${shortTime(s.hours.close)}`, "Opening hours"],
          ].map(([v, l], i) => (
            <Reveal key={l} delay={i * 0.08} className="border-line px-5 py-14 md:border-r md:px-10 md:py-20 [&:nth-child(odd)]:border-r md:last:border-r-0">
              <p className="display text-5xl text-plum md:text-6xl">{v}</p>
              <p className="mt-3 text-sm text-mute">{l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-28 md:px-10 md:py-40">
        <ReviewsCarousel
          reviews={REVIEWS}
          rating={s.business.googleRating}
          count={s.business.googleReviewCount}
          mapsUrl={s.business.mapsUrl}
        />
      </section>

      {/* How booking works */}
      <section className="bg-plum text-blush">
        <div className="mx-auto max-w-[1440px] px-5 py-28 md:px-10 md:py-36">
          <div className="grid gap-16 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="eyebrow !text-blush/60">Booking</p>
              <MaskLines
                className="display mt-4 text-5xl text-paper md:text-7xl"
                lines={["Two minutes", <em key="b" className="text-rose">to book.</em>]}
              />
              <Reveal className="mt-8 max-w-sm text-sm leading-relaxed text-blush/80">
                {c.freeWindowHours > 0
                  ? `Plans change. Cancel up to ${c.freeWindowHours} hours before your time for a full refund.`
                  : "Plans change. You can cancel from your account before your appointment."}{" "}
                <Link href="/cancellation-policy" className="underline underline-offset-4">
                  Read the policy
                </Link>
                .
              </Reveal>
            </div>
            <ol className="grid gap-px bg-blush/15 md:col-span-7 md:grid-cols-3">
              {[
                ["Choose", "Pick one treatment or combine a few. Prices and durations are on the menu."],
                ["Pick a time", `See open slots for the next ${s.booking.advanceDays} days, any day we're open.`],
                [
                  "Pay your way",
                  s.payments.cashEnabled && s.payments.onlineEnabled
                    ? "Pay online with UPI or card, or pay at the salon after your session."
                    : s.payments.onlineEnabled
                      ? "Pay online with UPI, card or net banking."
                      : "Pay at the salon after your session.",
                ],
              ].map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 0.1} className="bg-plum p-8">
                  <span className="font-display text-lg text-rose">0{i + 1}</span>
                  <p className="display mt-6 text-3xl text-paper">{t}</p>
                  <p className="mt-3 text-sm leading-relaxed text-blush/75">{d}</p>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal className="mt-16">
            <Link
              href="/book"
              className="inline-flex items-center gap-3 rounded-full bg-paper px-8 py-4 text-sm text-plum transition-colors hover:bg-blush"
            >
              Start booking <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>

      <VisitSection s={s} />
    </>
  );
}
