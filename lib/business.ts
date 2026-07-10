/**
 * Badar Natural Foods business identity — used on invoices, the portal shell
 * and the public page. Single source of truth (CLAUDE.md §1, §4.4).
 */
export const BUSINESS = {
  name: "Badar Natural Foods",
  owner: "Jahangeer Badar",
  phone: "+92 312 3546488",
  website: "https://badarnatural.com/",
  tagline: "Kiryana & daily kitchen essentials",
  taglineUrdu: "خالص اور قدرتی گھریلو اشیاء",
} as const;

/**
 * MANDATORY Urdu Nastaleeq tagline printed on EVERY invoice (§8.1). Fixed text
 * — not owner-editable — rendered in Noto Nastaliq Urdu, RTL, below the
 * thank-you line. Must render as joined Nastaleeq ligatures (the invoice PDF is
 * produced by the browser's own print-to-PDF, which shapes Urdu correctly).
 */
export const INVOICE_NASTALIQ_TAGLINE =
  "گندم کا تازہ آٹا، جؤ کا آٹا، چاول کا آٹا، ملٹی گرین آٹا، بہترین چاول، دالیں، خالص مصالحہ جات اور گروسری کا مکمل سامان دستیاب ہے";

/** Fallback thank-you + WhatsApp share text when AppSettings has no row yet. */
export const DEFAULT_THANK_YOU =
  "Shukriya! Aap ke bharosay ka shukriya — Badar Natural Foods";
export const DEFAULT_SHARE_TEXT =
  "Assalam-o-Alaikum, aap ka invoice attached hai. Shukriya — Badar Natural Foods";

/** Item category presets shown in the item form (free text still allowed). */
export const ITEM_CATEGORIES = [
  "Atta",
  "Chawal",
  "Ghee",
  "Oil",
  "Masala",
  "Honey",
  "Daal",
  "Sugar",
  "Dry Fruit",
  "Other",
] as const;
