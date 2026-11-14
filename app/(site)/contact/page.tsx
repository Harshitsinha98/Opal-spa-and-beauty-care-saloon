import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/site/PageHeader";
import { VisitSection } from "@/components/site/VisitSection";
import { ClipReveal } from "@/components/motion/Reveal";
import { Photo } from "@/components/Photo";

export const metadata: Metadata = {
  title: "Visit & contact",
  description: "Opal Spa & Beauty Care Salon, Shree Tower, E-7 Arera Colony, Bhopal 462016. Address, opening hours, phone and directions.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader
        eyebrow="Visit & contact"
        lines={["Find us in", <em key="a" className="text-wine">Arera Colony</em>]}
        intro="We're opposite the Railway Housing Society in Shree Tower, E-7. Look for the Opal sign at the glass doors."
      />
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <ClipReveal className="relative aspect-[16/9] md:aspect-[21/9]">
          <Photo name="reception-front" sizes="100vw" position="50% 60%" />
        </ClipReveal>
      </div>
      <div className="-mt-10">
        <VisitSection s={s} />
      </div>
    </>
  );
}
