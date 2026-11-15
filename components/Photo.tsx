import Image from "next/image";
import clsx from "clsx";
import media from "@/lib/media.json";

export type PhotoName = Exclude<keyof typeof media, "reception-walk">;

type Props = {
  name: PhotoName;
  className?: string;
  sizes?: string;
  priority?: boolean;
  alt?: string;
  position?: string;
};

/** Salon photo from the processed set: responsive, lazy by default, blurred placeholder while loading. */
export function Photo({ name, className, sizes = "(min-width: 1024px) 50vw, 100vw", priority, alt, position }: Props) {
  const m = media[name];
  return (
    <Image
      src={m.src}
      alt={alt ?? m.alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={m.blurDataURL}
      quality={75}
      className={clsx("object-cover", className)}
      style={position ? { objectPosition: position } : undefined}
    />
  );
}

export function photoMeta(name: PhotoName) {
  return media[name];
}

export const VIDEO = media["reception-walk"];
