/**
 * Unit conversion — the SINGLE source of truth for turning the many ways the
 * shop talks about quantity (pao / adha kilo / kilo / kg / bags) into the one
 * atomic unit stock is stored in (grams / ml). Prices are always quoted per KG
 * / per LITRE (1000 base units).
 *
 * IMPORTANT: keep this file free of Prisma imports — it is bundled into client
 * components (retail + wholesale entry live totals). Authoritative money math
 * still happens server-side with Prisma.Decimal.
 */

/** 1 kg / 1 litre = 1000 base units (grams / ml). */
export const BASE_PER_KG = 1000;

/** Retail quick-tap presets → grams. */
export const RETAIL_PRESETS = [
  { label: "1 Pao", grams: 250 },
  { label: "Adha Kilo", grams: 500 },
  { label: "1 Kilo", grams: 1000 },
] as const;

export type BaseUnit = "GRAM" | "ML";

/** kg (or litres) → base units. */
export function kgToBase(kg: number): number {
  return kg * BASE_PER_KG;
}

/** base units → kg (or litres). */
export function baseToKg(base: number): number {
  return base / BASE_PER_KG;
}

/** bags × per-bag weight → kg. */
export function bagsToKg(bags: number, bagWeightKg: number): number {
  return bags * bagWeightKg;
}

/** Line total for a quantity in grams at a per-kg rate. */
export function retailLineTotal(grams: number, ratePerKg: number): number {
  return baseToKg(grams) * ratePerKg;
}

/**
 * Display a stock/quantity amount (stored in base units) the way the shop
 * reads it: kg for anything ≥ 1 kg, otherwise grams. `ML` items read as
 * litres / ml. Trims trailing zeros.
 */
export function formatQty(baseAmount: number, baseUnit: BaseUnit = "GRAM"): string {
  const smallUnit = baseUnit === "ML" ? "ml" : "g";
  const bigUnit = baseUnit === "ML" ? "L" : "kg";
  const abs = Math.abs(baseAmount);
  if (abs === 0) return `0 ${bigUnit}`;
  if (abs < BASE_PER_KG) return `${trim(baseAmount)} ${smallUnit}`;
  return `${trim(baseToKg(baseAmount))} ${bigUnit}`;
}

/** Short kg label, e.g. "2.5 kg" — always in kg regardless of size. */
export function formatKg(kg: number, baseUnit: BaseUnit = "GRAM"): string {
  const unit = baseUnit === "ML" ? "L" : "kg";
  return `${trim(kg)} ${unit}`;
}

/** Drop trailing zeros: 2.500 → "2.5", 3.000 → "3". */
export function trim(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Number(n.toFixed(3)).toString();
}

/**
 * Parse a free-text retail quantity like "2.5", "2.5kg", "500g", "1 pao" into
 * grams. Returns null if unparseable. Presets handled by the caller via
 * RETAIL_PRESETS; this covers the free-text field.
 */
export function parseQtyToGrams(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (s === "") return null;
  if (s.includes("pao")) {
    const n = parseFloat(s) || 1;
    return n * 250;
  }
  const gMatch = s.match(/^([\d.]+)\s*(g|gram|grams)$/);
  if (gMatch) return parseFloat(gMatch[1]);
  const kgMatch = s.match(/^([\d.]+)\s*(kg|kilo|kilos|k)?$/);
  if (kgMatch) return parseFloat(kgMatch[1]) * BASE_PER_KG;
  return null;
}
