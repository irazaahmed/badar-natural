/**
 * Formatting helpers shared by server AND client components.
 * IMPORTANT: keep this file free of Prisma imports — it is bundled into the
 * client (entry form live totals). Prisma Decimal values can still be passed
 * to formatMoney because they satisfy `{ toString(): string }`.
 */

type MoneyLike = number | string | { toString(): string };

/** Consistent money display used everywhere: "Rs. 12,345.00". */
export function formatMoney(value: MoneyLike): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) return "Rs. —";
  return `Rs. ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// The shop runs on Pakistan Standard Time. Vercel servers run in UTC, so every
// date/time shown to the admin must be pinned to Asia/Karachi or it can read a
// day off around midnight.
export const PK_TZ = "Asia/Karachi";

/** "02 Jul 2026" (Pakistan time) — used for entry dates and due dates. */
export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: PK_TZ,
  });
}

/** "02 Jul, 14:30" (Pakistan time) — date + time for ledgers and sessions. */
export function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PK_TZ,
  });
}

/** Local-timezone yyyy-mm-dd for <input type="date"> defaults. */
export function todayInputValue(): string {
  const d = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** date + N days (returns a new Date, does not mutate). */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
