import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

/**
 * Shared helpers for admin server actions.
 * (No "use server" here on purpose — this file exports types + sync helpers.)
 */

/** Return shape for useActionState-driven forms. */
export type FormState =
  | {
      error?: string;
      ok?: boolean;
      /** Set when a sale is oversold and the form must confirm before proceeding. */
      overStock?: { itemName: string; available: string; requested: string };
    }
  | undefined;

/**
 * Defense in depth: every admin server action re-checks the session role,
 * even though proxy.ts already gates /admin/*. Throws on failure so the
 * action never proceeds.
 */
export async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: admin access required.");
  }
}

/** Read a trimmed string field from FormData ("" if missing/not a string). */
export function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Trimmed string or null (for optional columns like variant/note). */
export function fieldOrNull(formData: FormData, key: string): string | null {
  const value = field(formData, key);
  return value === "" ? null : value;
}

/** Parse an integer field; returns NaN if empty/invalid so callers can validate. */
export function intField(formData: FormData, key: string): number {
  const raw = field(formData, key);
  if (raw === "") return NaN;
  return Number.parseInt(raw, 10);
}

/**
 * Parse a money field into a Decimal, or null if empty/invalid. Never use
 * Float for money. Callers validate null / negativity as appropriate.
 */
export function moneyField(formData: FormData, key: string): Prisma.Decimal | null {
  const raw = field(formData, key);
  if (raw === "") return null;
  try {
    const d = new Prisma.Decimal(raw);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/**
 * Normalize a Pakistani phone number to international digits for wa.me links
 * and unique storage: strip non-digits, convert a leading 0 to 92, and a
 * leading 92 stays. Returns "" if there are no usable digits.
 *   0306 082 2082 -> 923060822082
 *   +92 306 0822082 -> 923060822082
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits === "") return "";
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return "92" + digits.slice(1);
  return digits;
}
