import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { ClipReveal, Parallax } from "@/components/motion/Reveal";
import { Photo, type PhotoName } from "@/components/Photo";
import { Lightbox } from "@/components/site/Lightbox";

export const metadata: Metadata = {
  title: "The house",
  description: "Photos from inside Opal Spa & Beauty Care Salon in Arera Colony, Bhopal: the lounge, reception and private treatment rooms.",
  alternates: { canonical: "/gallery" },
};

const LAYOUT: { name: PhotoName; cls: string; aspect: string; p?: number }[] = [
  { name: "entrance-sign", cls: "col-span-6 md:col-span-4", aspect: "aspect-[3/4.4]" },
  { name: "reception", cls: "col-span-6 md:col-span-5 md:col-start-6 mt-24", aspect: "aspect-[4/5]", p: 40 },
  { name: "lounge", cls: "col-span-12 md:col-span-7", aspect: "aspect-[4/3]" },
  { name: "fountain", cls: "col-span-5 md:col-span-3 md:col-start-9 md:mt-40", aspect: "aspect-[2/3.6]", p: 60 },
  { name: "room-buddha", cls: "col-span-7 md:col-span-4 mt-10", aspect: "aspect-[3/4]" },
  { name: "reception-mirror", cls: "col-span-12 md:col-span-6 md:col-start-6 md:mt-32", aspect: "aspect-[4/3]", p: 40 },
  { name: "corridor", cls: "col-span-6 md:col-span-3", aspect: "aspect-[3/4]" },
  { name: "room-wine", cls: "col-span-6 md:col-span-4 md:col-start-5 mt-16", aspect: "aspect-[5/6]", p: 50 },
  { name: "lounge-tall", cls: "col-span-12 md:col-span-4 md:mt-48", aspect: "aspect-[3/4]" },
  { name: "room-drapes", cls: "col-span-6 md:col-span-5", aspect: "aspect-[4/5]" },
  { name: "entrance", cls: "col-span-6 md:col-span-3 md:col-start-8 mt-20", aspect: "aspect-[3/4]", p: 40 },
  { name: "room-rose", cls: "col-span-12 md:col-span-5 md:col-start-4", aspect: "aspect-[1/1]" },
];

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="The house"
        lines={["Inside", <em key="o" className="text-wine">Opal</em>]}
        intro="Every photo on this site was taken inside the salon at Shree Tower. No stock images."
      />
      <Lightbox>
        <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-4 px-5 pb-36 md:gap-8 md:px-10">
          {LAYOUT.map((l, i) => {
            const img = (
              <ClipReveal className={`relative ${l.aspect}`} delay={(i % 3) * 0.08}>
                <button type="button" data-lightbox={l.name} className="absolute inset-0 block h-full w-full" data-cursor="View" aria-label="Open photo">
                  <Photo name={l.name} sizes="(min-width: 768px) 40vw, 100vw" className="transition-transform duration-[1.6s] ease-[cubic-bezier(.16,1,.3,1)] hover:scale-[1.04]" />
                </button>
              </ClipReveal>
            );
            return (
              <figure key={l.name} className={l.cls}>
                {l.p ? <Parallax offset={l.p}>{img}</Parallax> : img}
              </figure>
            );
          })}
        </div>
      </Lightbox>
    </>
  );
}
