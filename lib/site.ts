export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE = {
  name: "Opal Spa & Beauty Care Salon",
  short: "Opal",
  tagline: "Family spa & beauty care in Arera Colony, Bhopal",
  description:
    "Opal is a family spa and beauty care salon in Arera Colony, Bhopal. Massages, body treatments, facials, hair and nail care in private, quiet rooms. Open every day, 11:30 am to 9 pm.",
  city: "Bhopal",
  locality: "Arera Colony",
  region: "Madhya Pradesh",
  postalCode: "462016",
};

export const NAV = [
  { href: "/services", label: "Services" },
  { href: "/shop", label: "Shop" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function waHref(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  const n = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
