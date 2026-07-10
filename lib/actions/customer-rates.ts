"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin, field, moneyField } from "./utils";

/**
 * Per-customer negotiated item rates (§7.2). These override the item's default
 * wholesale price (and the customer's standing discount) when a wholesale sale
 * line is built for this customer. Managed from the customer detail screen.
 */
export async function setCustomerItemRate(customerId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const itemId = field(formData, "itemId");
  const rate = moneyField(formData, "ratePerKg");
  if (!itemId || !rate || rate.lte(0)) return; // ignore invalid rows (owner tool)

  await prisma.customerItemRate.upsert({
    where: { customerId_itemId: { customerId, itemId } },
    update: { ratePerKg: rate },
    create: { customerId, itemId, ratePerKg: rate },
  });
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function removeCustomerItemRate(customerId: string, itemId: string): Promise<void> {
  await requireAdmin();
  await prisma.customerItemRate
    .delete({ where: { customerId_itemId: { customerId, itemId } } })
    .catch((e) => {
      // already gone — ignore the not-found race
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")) throw e;
    });
  revalidatePath(`/admin/customers/${customerId}`);
}
