/**
 * Date-range parsing for the reports section (§7.3). Ranges are half-open
 * [gte, lt) in UTC, but the from/to inputs are interpreted in Pakistan time
 * (UTC+5, no DST) so a report for "July" lines up with the shop's calendar.
 * Keep this Prisma-free — it is imported by both server pages and helpers.
 */

const PK_OFFSET = "+05:00";

export type ReportRange = {
  gte: Date; // inclusive start (UTC)
  lt: Date; // exclusive end (UTC)
  fromInput: string; // yyyy-mm-dd for the <input value>
  toInput: string; // yyyy-mm-dd for the <input value>
  label: string; // human label, e.g. "01 Jul 2026 – 31 Jul 2026"
};

function pkParts(d: Date): { y: number; m: number; day: number } {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const [y, m, day] = s.split("-").map(Number);
  return { y, m, day };
}

function isValidYmd(s: string | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Add N days to a yyyy-mm-dd string, returning a yyyy-mm-dd string. */
function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00${PK_OFFSET}`);
  d.setUTCDate(d.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Resolve a from/to pair (yyyy-mm-dd, PK time) into a UTC half-open range.
 * Defaults to the current calendar month when either bound is missing/invalid.
 */
export function resolveRange(from?: string, to?: string): ReportRange {
  const today = pkParts(new Date());
  const monthStart = `${today.y}-${String(today.m).padStart(2, "0")}-01`;

  const fromInput = isValidYmd(from) ? from : monthStart;
  const toInput = isValidYmd(to) ? to : `${today.y}-${String(today.m).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`;

  const gte = new Date(`${fromInput}T00:00:00.000${PK_OFFSET}`);
  // `to` is inclusive for the user, so the exclusive bound is the next day.
  const lt = new Date(`${addDaysYmd(toInput, 1)}T00:00:00.000${PK_OFFSET}`);

  const fmt = (ymd: string) =>
    new Date(`${ymd}T00:00:00${PK_OFFSET}`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Karachi",
    });

  return { gte, lt, fromInput, toInput, label: `${fmt(fromInput)} – ${fmt(toInput)}` };
}
