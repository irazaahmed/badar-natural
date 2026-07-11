"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, PaymentType, PaymentStatus, PaymentMethod, SupplierEntryType, PaymentDirection } from "@prisma/client";
import prisma from "@/lib/prisma";
import { appendSupplierLedger, nextInvoiceNumber } from "@/lib/ledger";
import { resolveSupplier } from "./suppliers";
import { requireAdmin, field, intField, moneyField, type FormState } from "./utils";

const KG = new Prisma.Decimal(1000);

type LineInput = {
  itemId: string;
  mode: "kg" | "bag";
  quantity: number; // kg or bags depending on mode
  bagWeightKg?: number;
  ratePerKg: number;
};

function parseLines(formData: FormData): LineInput[] {
  const raw = field(formData, "items");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseMethod(formData: FormData): PaymentMethod {
  const m = field(formData, "method");
  return (Object.values(PaymentMethod) as string[]).includes(m)
    ? (m as PaymentMethod)
    : PaymentMethod.CASH;
}

/**
 * Multi-item purchase from a supplier. In ONE transaction: create the Purchase
 * + its lines, increment each item's stock and lastPurchasePrice, append the
 * supplier ledger PURCHASE entry, and — for any amount paid now — a Payment +
 * matching PAYMENT ledger entry so `totalPayable` reflects total − paid.
 */
export async function createPurchase(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const lines = parseLines(formData);
  if (lines.length === 0) return { error: "Add at least one item." };

  const paymentType =
    field(formData, "paymentType") === "CREDIT" ? PaymentType.CREDIT : PaymentType.CASH;
  const method = parseMethod(formData);

  // Normalise + validate lines to kg.
  const prepared: { itemId: string; quantityKg: Prisma.Decimal; ratePerKg: Prisma.Decimal; lineTotal: Prisma.Decimal }[] = [];
  for (const l of lines) {
    if (!l.itemId) return { error: "Every line needs an item." };
    const qty = new Prisma.Decimal(l.quantity || 0);
    if (qty.lte(0)) return { error: "Every line needs a positive quantity." };
    const rate = new Prisma.Decimal(l.ratePerKg || 0);
    if (rate.lte(0)) return { error: "Every line needs a valid rate per kg." };
    let quantityKg = qty;
    if (l.mode === "bag") {
      const bw = new Prisma.Decimal(l.bagWeightKg || 0);
      if (bw.lte(0)) return { error: "Bag weight must be positive for bag entries." };
      quantityKg = qty.mul(bw);
    }
    prepared.push({ itemId: l.itemId, quantityKg, ratePerKg: rate, lineTotal: quantityKg.mul(rate) });
  }

  const totalAmount = prepared.reduce((s, p) => s.add(p.lineTotal), new Prisma.Decimal(0));

  let paidAmount: Prisma.Decimal;
  if (paymentType === PaymentType.CASH) {
    paidAmount = totalAmount;
  } else {
    const entered = moneyField(formData, "paidAmount") ?? new Prisma.Decimal(0);
    if (entered.lt(0) || entered.gt(totalAmount))
      return { error: "Amount paid must be between 0 and the total." };
    paidAmount = entered;
  }
  const due = totalAmount.minus(paidAmount);
  const status = due.isZero()
    ? PaymentStatus.PAID
    : paidAmount.isZero()
      ? PaymentStatus.UNPAID
      : PaymentStatus.PARTIAL;

  const creditDays = paymentType === PaymentType.CREDIT ? intField(formData, "creditDays") : NaN;
  const dueDate =
    Number.isInteger(creditDays) && creditDays > 0
      ? new Date(Date.now() + creditDays * 86400000)
      : null;

  let purchaseId: string;
  try {
    purchaseId = await prisma.$transaction(async (tx) => {
      const supplierId = await resolveSupplier(tx, {
        supplierId: field(formData, "supplierId") || null,
        name: field(formData, "supplierName") || null,
        phone: field(formData, "supplierPhone") || null,
      });

      const invoiceNumber = await nextInvoiceNumber(tx, "PUR");
      const purchase = await tx.purchase.create({
        data: {
          supplierId,
          invoiceNumber,
          paymentType,
          creditDays: paymentType === PaymentType.CREDIT && Number.isInteger(creditDays) ? creditDays : null,
          dueDate,
          status,
          totalAmount,
          paidAmount,
          items: {
            create: prepared.map((p) => ({
              itemId: p.itemId,
              quantityKg: p.quantityKg,
              ratePerKg: p.ratePerKg,
              lineTotal: p.lineTotal,
            })),
          },
        },
      });

      // Stock in + last purchase price per line.
      for (const p of prepared) {
        await tx.item.update({
          where: { id: p.itemId },
          data: {
            currentStock: { increment: p.quantityKg.mul(KG) },
            lastPurchasePricePerKg: p.ratePerKg,
          },
        });
      }

      // Payable goes up by the full purchase; a paid-now amount brings it back.
      await appendSupplierLedger(tx, {
        supplierId,
        type: SupplierEntryType.PURCHASE,
        amount: totalAmount,
        purchaseId: purchase.id,
        note: `Purchase ${invoiceNumber}`,
      });

      if (paidAmount.gt(0)) {
        const payment = await tx.payment.create({
          data: {
            direction: PaymentDirection.PAYABLE,
            supplierId,
            purchaseId: purchase.id,
            amount: paidAmount,
            method,
            note: paymentType === PaymentType.CASH ? "Cash purchase" : "Paid at purchase",
          },
        });
        await appendSupplierLedger(tx, {
          supplierId,
          type: SupplierEntryType.PAYMENT,
          amount: paidAmount.negated(),
          purchaseId: purchase.id,
          paymentId: payment.id,
          note: `Payment for ${invoiceNumber}`,
        });
      }

      return purchase.id;
    }, { timeout: 20000, maxWait: 15000 });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record the purchase." };
  }

  revalidatePath("/admin/purchases");
  revalidatePath("/admin/items");
  revalidatePath("/admin/suppliers");
  revalidatePath("/admin");
  redirect(`/admin/purchases/${purchaseId}`);
}

/** Record a payment against a credit purchase (settles supplier payable). */
export async function recordPurchasePayment(
  purchaseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const amount = moneyField(formData, "amount");
  const method = parseMethod(formData);
  if (!amount || amount.lte(0)) return { error: "Enter a valid amount." };

  try {
    await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUniqueOrThrow({
        where: { id: purchaseId },
        select: { id: true, supplierId: true, totalAmount: true, paidAmount: true, invoiceNumber: true },
      });
      const remaining = purchase.totalAmount.minus(purchase.paidAmount);
      if (amount.gt(remaining))
        throw new Error(`Amount exceeds the pending Rs. ${remaining.toString()}.`);

      const newPaid = purchase.paidAmount.add(amount);
      const status = newPaid.equals(purchase.totalAmount) ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

      const payment = await tx.payment.create({
        data: {
          direction: PaymentDirection.PAYABLE,
          supplierId: purchase.supplierId,
          purchaseId,
          amount,
          method,
          note: `Payment for ${purchase.invoiceNumber}`,
        },
      });
      await tx.purchase.update({
        where: { id: purchaseId },
        data: { paidAmount: newPaid, status },
      });
      await appendSupplierLedger(tx, {
        supplierId: purchase.supplierId,
        type: SupplierEntryType.PAYMENT,
        amount: amount.negated(),
        purchaseId,
        paymentId: payment.id,
        note: `Payment for ${purchase.invoiceNumber}`,
      });
    }, { timeout: 20000, maxWait: 15000 });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record the payment." };
  }

  revalidatePath(`/admin/purchases/${purchaseId}`);
  revalidatePath("/admin/suppliers");
  revalidatePath("/admin");
  return { ok: true };
}
