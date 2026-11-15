import type { Metadata } from "next";
import Link from "next/link";
import { getMenu } from "@/lib/catalog";
import { LegalPage, LEGAL_UPDATED } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Every page on the Opal Spa website.",
  alternates: { canonical: "/sitemap" },
};

const GROUPS: { title: string; links: [string, string][] }[] = [
  {
    title: "Visit",
    links: [
      ["/", "Home"],
      ["/services", "Menu & prices"],
      ["/gallery", "The house (photos)"],
      ["/contact", "Visit & contact"],
    ],
  },
  {
    title: "Book & buy",
    links: [
      ["/book", "Book a visit"],
      ["/shop", "Shop (pickup only)"],
      ["/checkout", "Checkout"],
    ],
  },
  {
    title: "Your account",
    links: [
      ["/sign-in", "Sign in"],
      ["/sign-up", "Create an account"],
      ["/account", "My bookings & orders"],
    ],
  },
  {
    title: "Policies",
    links: [
      ["/terms", "Terms of Service"],
      ["/privacy", "Privacy Policy"],
      ["/cancellation-policy", "Cancellation & Refund Policy"],
    ],
  },
];

export default async function SitemapPage() {
  const menu = await getMenu();
  return (
    <LegalPage title="Sitemap" updated={LEGAL_UPDATED}>
      <div className="grid gap-10 sm:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="!mt-0">{g.title}</h2>
            <ul>
              {g.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="sm:col-span-2">
          <h2>Treatments</h2>
          <ul className="sm:columns-2">
            {menu.map((c) => (
              <li key={c.id}>
                <Link href={`/services#${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="mt-10 text-sm">
        Machine-readable version: <a href="/sitemap.xml">sitemap.xml</a>
      </p>
    </LegalPage>
  );
}
