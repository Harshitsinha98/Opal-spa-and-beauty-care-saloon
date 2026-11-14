/** The salon runs on Indian Standard Time (UTC+5:30, no DST). */
const IST_OFFSET_MIN = 330;

/** Current date (YYYY-MM-DD) and minutes-from-midnight in IST. */
export function nowIST(now = new Date()) {
  const t = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  const ymd = t.toISOString().slice(0, 10);
  const minutes = t.getUTCHours() * 60 + t.getUTCMinutes();
  return { ymd, minutes };
}

/** Converts an IST wall-clock date + minutes into an absolute Date. */
export function istToDate(ymd: string, minutes: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, minutes) - IST_OFFSET_MIN * 60_000);
}

export function addDays(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekday(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isValidYMD(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
