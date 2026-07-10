/**
 * WhatsApp helpers. Public/business CTAs link to the SHOP number; credit
 * reminders link to the CUSTOMER's / SUPPLIER's own number.
 */

/** Badar Natural Foods business WhatsApp (CLAUDE.md §4.4): +92 312 3546488. */
export const SHOP_WHATSAPP = "923123546488";

/** Build a wa.me URL. `phone` should be international digits (no +). */
export function waLink(phone: string, text?: string): string {
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** CTA to the shop, optionally with a prefilled message. */
export function shopWaLink(text?: string): string {
  return waLink(SHOP_WHATSAPP, text);
}

/** Reminder to a wholesale customer stating their pending receivable. */
export function receivableReminder(name: string, amountDue: string): string {
  return `Assalam o Alaikum ${name}, aap ka Badar Natural Foods par Rs. ${amountDue} baqaya hai. Meherbani farma kar ada kar dein. Shukriya.`;
}
