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
