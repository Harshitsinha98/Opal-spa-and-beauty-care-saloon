import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["", 1, "weekly"],
    ["/services", 0.9, "weekly"],
    ["/book", 0.9, "weekly"],
    ["/gallery", 0.7, "monthly"],
    ["/shop", 0.7, "weekly"],
    ["/contact", 0.8, "monthly"],
    ["/terms", 0.3, "yearly"],
    ["/privacy", 0.3, "yearly"],
    ["/cancellation-policy", 0.3, "yearly"],
    ["/sitemap", 0.2, "yearly"],
  ];
  return pages.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
