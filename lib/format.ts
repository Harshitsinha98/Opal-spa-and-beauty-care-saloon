/** All money is stored as integer paise. */
export function rupees(paise: number) {
  const r = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(r) ? 0 : 2,
  }).format(r);
}

export function minutesToLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function hhmmToMinutes(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHHMM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function durationLabel(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** "2026-11-14" -> "Sat, 14 Nov 2026" */
export function dateLabel(ymd: string, opts: Intl.DateTimeFormatOptions = {}) {
  const [y, mo, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(new Date(Date.UTC(y, mo - 1, d)));
}

export function dateTimeLabel(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** "Open daily, 11:30 am – 9:00 pm" or "Open 11:30 am – 9:00 pm, closed Tue" */
export function hoursText(h: { open: string; close: string; closedWeekdays: number[] }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const range = `${minutesToLabel(hhmmToMinutes(h.open))} – ${minutesToLabel(hhmmToMinutes(h.close))}`;
  if (!h.closedWeekdays.length) return `Open daily, ${range}`;
  return `Open ${range}, closed ${h.closedWeekdays.map((d) => days[d]).join(", ")}`;
}
