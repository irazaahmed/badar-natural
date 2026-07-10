"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin, field, fieldOrNull, normalizePhone, type FormState } from "./utils";

export async function saveSupplier(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = field(formData, "name");
  const phone = normalizePhone(field(formData, "phone"));
  const address = fieldOrNull(formData, "address");
  if (!name) return { error: "Supplier name is required." };

  await prisma.supplier.create({
    data: { name, phone: phone || null, address },
  });

  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}

export async function updateSupplier(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const name = field(formData, "name");
  const phone = normalizePhone(field(formData, "phone"));
  const address = fieldOrNull(formData, "address");
  if (!name) return { error: "Supplier name is required." };

  await prisma.supplier.update({
    where: { id },
    data: { name, phone: phone || null, address },
  });

  revalidatePath("/admin/suppliers");
  redirect(`/admin/suppliers/${id}`);
}

export async function deleteSupplier(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const purchases = await prisma.purchase.count({ where: { supplierId: id } });
  if (purchases > 0) {
    return { error: "Cannot delete a supplier with purchase history." };
  }
  await prisma.$transaction([
    prisma.supplierLedgerEntry.deleteMany({ where: { supplierId: id } }),
    prisma.supplier.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/suppliers");
  return {};
}

/**
 * Resolve a supplier for the purchase form inside a transaction. Priority: an
 * explicit supplierId, else an inline new name (+ optional phone) which creates
 * one. Throws if neither is supplied — a purchase must have a supplier.
 */
export async function resolveSupplier(
  tx: Prisma.TransactionClient,
  input: { supplierId?: string | null; name?: string | null; phone?: string | null },
): Promise<string> {
  if (input.supplierId) return input.supplierId;
  const name = (input.name ?? "").trim();
  if (!name) throw new Error("Select or add a supplier.");
  const phone = normalizePhone(input.phone ?? "");
  const created = await tx.supplier.create({
    data: { name, phone: phone || null },
  });
  return created.id;
}
