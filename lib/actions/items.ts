"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, BaseUnit } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin, field, fieldOrNull, moneyField, type FormState } from "./utils";

const KG = new Prisma.Decimal(1000); // 1 kg / 1 L = 1000 base units

/** Shared field parsing for create/update. Returns validated values or an error string. */
function parseItem(formData: FormData) {
  const name = field(formData, "name");
  const category = field(formData, "category");
  const baseUnit = field(formData, "baseUnit") === "ML" ? BaseUnit.ML : BaseUnit.GRAM;
  const retailPricePerKg = moneyField(formData, "retailPricePerKg");
  const wholesalePricePerKg = moneyField(formData, "wholesalePricePerKg");
  const lowStockKg = moneyField(formData, "lowStockThresholdKg");
  const bagWeightKg = moneyField(formData, "bagWeightKg");
  const barcode = fieldOrNull(formData, "barcode");
  const packKg = moneyField(formData, "defaultPackKg"); // pre-packaged size, kg/L

  if (!name) return { error: "Item name is required." as string };
  if (!category) return { error: "Category is required." };
  if (!retailPricePerKg || retailPricePerKg.lte(0))
    return { error: "Enter a valid retail price (per kg)." };
  if (!wholesalePricePerKg || wholesalePricePerKg.lte(0))
    return { error: "Enter a valid wholesale price (per kg)." };
  if (bagWeightKg && bagWeightKg.lte(0)) return { error: "Bag weight must be positive." };
  if (lowStockKg && lowStockKg.lt(0)) return { error: "Low-stock threshold cannot be negative." };
  if (packKg && packKg.lte(0)) return { error: "Default pack size must be positive." };

  return {
    name,
    category,
    baseUnit,
    retailPricePerKg,
    wholesalePricePerKg,
    lowStockThreshold: (lowStockKg ?? new Prisma.Decimal(0)).mul(KG),
    bagWeightKg: bagWeightKg ?? null,
    barcode,
    // stored in base units (grams / ml) as an integer for scan auto-fill (§8.3)
    defaultPackWeightGrams: packKg ? Math.round(packKg.mul(KG).toNumber()) : null,
  };
}

/** Prisma unique-constraint (P2002) → friendly message for the barcode field. */
function isBarcodeConflict(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002" &&
    (e.meta?.target as string[] | undefined)?.includes("barcode") === true
  );
}

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseItem(formData);
  if ("error" in parsed) return { error: parsed.error };

  const openingKg = moneyField(formData, "openingStockKg");
  const currentStock = (openingKg ?? new Prisma.Decimal(0)).mul(KG);

  try {
    await prisma.item.create({
      data: {
        name: parsed.name,
        category: parsed.category,
        baseUnit: parsed.baseUnit,
        retailPricePerKg: parsed.retailPricePerKg,
        wholesalePricePerKg: parsed.wholesalePricePerKg,
        lowStockThreshold: parsed.lowStockThreshold,
        bagWeightKg: parsed.bagWeightKg,
        barcode: parsed.barcode,
        defaultPackWeightGrams: parsed.defaultPackWeightGrams,
        currentStock,
      },
    });
  } catch (e) {
    if (isBarcodeConflict(e)) return { error: "Another item already uses that barcode." };
    throw e;
  }

  revalidatePath("/admin/items");
  redirect("/admin/items");
}

export async function updateItem(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseItem(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Stock is NOT edited here — it moves only through purchases/sales — except an
  // explicit stock correction field (leave blank to keep current stock).
  const data: Prisma.ItemUpdateInput = {
    name: parsed.name,
    category: parsed.category,
    baseUnit: parsed.baseUnit,
    retailPricePerKg: parsed.retailPricePerKg,
    wholesalePricePerKg: parsed.wholesalePricePerKg,
    lowStockThreshold: parsed.lowStockThreshold,
    bagWeightKg: parsed.bagWeightKg,
    barcode: parsed.barcode,
    defaultPackWeightGrams: parsed.defaultPackWeightGrams,
  };

  const correctionKg = moneyField(formData, "stockCorrectionKg");
  if (correctionKg) {
    if (correctionKg.lt(0)) return { error: "Corrected stock cannot be negative." };
    data.currentStock = correctionKg.mul(KG);
  }

  try {
    await prisma.item.update({ where: { id }, data });
  } catch (e) {
    if (isBarcodeConflict(e)) return { error: "Another item already uses that barcode." };
    throw e;
  }

  revalidatePath("/admin/items");
  redirect("/admin/items");
}

export async function setItemActive(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  await prisma.item.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/items");
}

export async function deleteItem(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const [purchases, sales] = await Promise.all([
    prisma.purchaseItem.count({ where: { itemId: id } }),
    prisma.saleItem.count({ where: { itemId: id } }),
  ]);
  if (purchases + sales > 0) {
    return {
      error: "This item has purchase/sale history — deactivate it instead of deleting.",
    };
  }
  await prisma.item.delete({ where: { id } });
  revalidatePath("/admin/items");
  return {};
}
