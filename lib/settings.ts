import prisma from "@/lib/prisma";
import { DEFAULT_THANK_YOU, DEFAULT_SHARE_TEXT } from "@/lib/business";

/**
 * App-wide settings live in a single AppSettings row (id = 1). This get-or-
 * create keeps callers simple: the row is materialised on first read with the
 * schema defaults, so the invoice/share flows never have to null-check.
 */
export async function getSettings() {
  const existing = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.appSettings.create({
    data: {
      id: 1,
      thankYouMessage: DEFAULT_THANK_YOU,
      sharePrefillText: DEFAULT_SHARE_TEXT,
    },
  });
}
