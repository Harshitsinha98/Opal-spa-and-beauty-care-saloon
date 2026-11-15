import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { Photo, photoMeta, type PhotoName } from "@/components/Photo";
import { Lightbox } from "@/components/site/Lightbox";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from inside Opal Spa & Beauty Care Salon in Arera Colony, Bhopal: the lounge, reception and private treatment rooms.",
  alternates: { canonical: "/gallery" },
};

const PHOTOS: PhotoName[] = [
  "entrance-sign",
  "reception",
  "lounge",
  "fountain",
  "room-buddha",
  "reception-mirror",
  "corridor",
  "room-wine",
  "lounge-tall",
  "room-drapes",
  "entrance",
  "room-rose",
];

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title={
          <>
            Inside <em className="text-brand">Opal</em>
          </>
        }
        intro="Every photo on this site was taken inside the salon at Shree Tower. No stock images. Tap a photo to enlarge it."
      />
      <Lightbox>
        <div className="mx-auto max-w-[1280px] columns-2 gap-4 px-5 pb-24 md:columns-3 md:px-8 lg:gap-5">
          {PHOTOS.map((n, i) => {
            const m = photoMeta(n);
            return (
              <Reveal key={n} delay={(i % 3) * 0.06} className="mb-4 break-inside-avoid lg:mb-5">
                <button
                  type="button"
                  data-lightbox={n}
                  className="group relative block w-full overflow-hidden rounded-3xl bg-sand"
                  style={{ aspectRatio: `${m.width} / ${m.height}` }}
                  aria-label={`Open photo: ${m.alt}`}
                >
                  <Photo name={n} sizes="(min-width: 768px) 33vw, 50vw" className="transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-x-3 bottom-3 translate-y-2 rounded-2xl bg-white/90 px-3 py-2 text-left text-xs font-medium opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {m.alt}
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </Lightbox>
    </>
  );
}
