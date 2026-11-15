import type { Settings } from "@/lib/settings";
import { SITE, SITE_URL } from "@/lib/site";

export function LocalBusinessJsonLd({ s }: { s: Settings }) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const data = {
    "@context": "https://schema.org",
    "@type": "DaySpa",
    name: s.business.name,
    url: SITE_URL,
    image: `${SITE_URL}/media/lounge.webp`,
    telephone: s.business.phone || undefined,
    email: s.business.email || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Shree Tower, E7/851, opposite Railway Housing Society, E-7, Arera Colony",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      postalCode: SITE.postalCode,
      addressCountry: "IN",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days.filter((_, i) => !s.hours.closedWeekdays.includes(i)),
        opens: s.hours.open,
        closes: s.hours.close,
      },
    ],
    // No aggregateRating here: Google treats self-published ratings for a LocalBusiness as self-serving.
    priceRange: "₹₹",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
