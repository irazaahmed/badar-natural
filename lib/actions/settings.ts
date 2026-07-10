"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { DEFAULT_THANK_YOU, DEFAULT_SHARE_TEXT } from "@/lib/business";
import { requireAdmin, field, type FormState } from "./utils";

/**
 * Update the owner-editable invoice settings (§7.1 / §7.4): the thank-you line
 * printed on every invoice and the WhatsApp share pre-fill text. Upserts the
 * AppSettings singleton (id = 1). The fixed Urdu Nastaleeq tagline (§8.1) is a
 * constant, not editable here.
 */
export async function updateInvoiceSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const thankYouMessage = field(formData, "thankYouMessage") || DEFAULT_THANK_YOU;
  const sharePrefillText = field(formData, "sharePrefillText") || DEFAULT_SHARE_TEXT;

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { thankYouMessage, sharePrefillText },
    create: { id: 1, thankYouMessage, sharePrefillText },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/sales");
  return { ok: true };
}
