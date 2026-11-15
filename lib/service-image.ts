import media from "./media.json";

type Name = Exclude<keyof typeof media, "reception-walk">;

/** Salon photos to fall back on per category when a service has no image of its own. */
const BY_CATEGORY: Record<string, Name[]> = {
  massage: ["room-buddha", "room-wine", "room-drapes", "room-rose", "room-soft"],
  "body-rituals": ["room-soft", "room-rose", "room-drapes"],
  skin: ["reception-mirror", "room-buddha"],
  hair: ["reception-front", "reception-mirror"],
  "hands-feet-grooming": ["lounge", "lounge-tall", "reception"],
};
const ALL: Name[] = ["room-buddha", "lounge", "room-wine", "reception-mirror", "room-drapes", "fountain", "room-rose", "reception"];

export function serviceImage(image: string | null, categorySlug: string | undefined, index: number) {
  if (image) return image;
  const list = (categorySlug && BY_CATEGORY[categorySlug]) || ALL;
  return media[list[index % list.length]].src;
}
