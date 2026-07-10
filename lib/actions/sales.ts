"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, SaleChannel, PaymentType, PaymentStatus, PaymentMethod, CustomerType, CustomerEntryType, PaymentDirection } from "@prisma/client";
import prisma from "@/lib/prisma";
import { appendCustomerLedger, nextInvoiceNumber } from "@/lib/ledger";
import { resolveCustomer } from "./customers";
import { requireAdmin, field, intField, moneyField, type FormState } from "./utils";

const KG = new Prisma.Decimal(1000);

type SaleLineInput = {
  itemId: string;
  quantityGrams: number; // already normalised to base units by the form
  quantityLabel: string; // "1 pao", "2.5 kg", "1 bag (20 kg)"…
  ratePerKg: number;
};

function parseLines(formData: FormData): SaleLineInput[] {
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
 * Unified sale entry for BOTH channels (retail + wholesale). One transaction:
 * create the Sale + lines, decrement each item's stock, and — for credit — a
 * customer-ledger SALE entry plus a Payment for any amount received now.
 *
 * Negative stock is WARNED, not hard-blocked: a real shop oversells and trues
 * up later. The form must resubmit with confirmOverStock=1 to proceed.
 */
export async function createSale(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const channel = field(formData, "channel") === "WHOLESALE" ? SaleChannel.WHOLESALE : SaleChannel.RETAIL;
  const lines = parseLines(formData);
  if (lines.length === 0) return { error: "Add at least one item." };

  const prepared: {
    itemId: string;
    quantityGrams: Prisma.Decimal;
    quantityLabel: string;
    ratePerKg: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
  }[] = [];
  for (const l of lines) {
    if (!l.itemId) return { error: "Every line needs an item." };
    const grams = new Prisma.Decimal(l.quantityGrams || 0);
    if (grams.lte(0)) return { error: "Every line needs a positive quantity." };
    const rate = new Prisma.Decimal(l.ratePerKg || 0);
    if (rate.lte(0)) return { error: "Every line needs a valid rate." };
    prepared.push({
      itemId: l.itemId,
      quantityGrams: grams,
      quantityLabel: l.quantityLabel || `${grams.div(KG).toString()} kg`,
      ratePerKg: rate,
      lineTotal: grams.div(KG).mul(rate),
    });
  }

  const totalAmount = prepared.reduce((s, p) => s.add(p.lineTotal), new Prisma.Decimal(0));

  const paymentType =
    field(formData, "paymentType") === "CREDIT" ? PaymentType.CREDIT : PaymentType.CASH;
  const method = parseMethod(formData);
  const confirmOverStock = field(formData, "confirmOverStock") === "1";
  const confirmCreditLimit = field(formData, "confirmCreditLimit") === "1";

  let paidAmount: Prisma.Decimal;
  if (paymentType === PaymentType.CASH) {
    paidAmount = totalAmount;
  } else {
    const entered = moneyField(formData, "amountPaid") ?? new Prisma.Decimal(0);
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
    Number.isInteger(creditDays) && creditDays > 0 ? new Date(Date.now() + creditDays * 86400000) : null;

  // A credit sale must be attached to a customer (can't owe an anonymous walk-in).
  const hasCustomer =
    !!field(formData, "customerId") || !!field(formData, "customerName") || !!field(formData, "customerPhone");
  if (paymentType === PaymentType.CREDIT && !hasCustomer)
    return { error: "Credit sales need a customer. Select or add one." };

  let saleId: string;
  try {
    saleId = await prisma.$transaction(async (tx) => {
      // Over-stock check across the whole sale (aggregate per item). While here,
      // snapshot each item's current purchase cost for the profit report (§7.3).
      const wanted = new Map<string, Prisma.Decimal>();
      for (const p of prepared)
        wanted.set(p.itemId, (wanted.get(p.itemId) ?? new Prisma.Decimal(0)).add(p.quantityGrams));
      const costByItem = new Map<string, Prisma.Decimal | null>();
      for (const [itemId, need] of wanted) {
        const item = await tx.item.findUniqueOrThrow({
          where: { id: itemId },
          select: { name: true, currentStock: true, baseUnit: true, lastPurchasePricePerKg: true },
        });
        costByItem.set(itemId, item.lastPurchasePricePerKg ?? null);
        if (need.gt(item.currentStock) && !confirmOverStock) {
          throw new OverStockError(item.name, item.currentStock.div(KG).toString(), need.div(KG).toString());
        }
      }

      const customerId = await resolveCustomer(tx, {
        customerId: field(formData, "customerId") || null,
        name: field(formData, "customerName") || null,
        phone: field(formData, "customerPhone") || null,
        type: channel === SaleChannel.WHOLESALE ? CustomerType.WHOLESALE : CustomerType.RETAIL_REGULAR,
      });

      // Credit-limit guard (§7.2): warn-with-override. Only a credit sale that
      // leaves an outstanding balance can breach a limit. The owner may confirm.
      if (paymentType === PaymentType.CREDIT && customerId && due.gt(0) && !confirmCreditLimit) {
        const cust = await tx.customer.findUniqueOrThrow({
          where: { id: customerId },
          select: { name: true, creditLimit: true, totalReceivable: true },
        });
        if (cust.creditLimit != null) {
          const afterSale = cust.totalReceivable.add(due);
          if (afterSale.gt(cust.creditLimit)) {
            throw new CreditLimitError(
              cust.name,
              cust.creditLimit.toString(),
              cust.totalReceivable.toString(),
              afterSale.toString(),
            );
          }
        }
      }

      const invoiceNumber = await nextInvoiceNumber(tx, channel === SaleChannel.WHOLESALE ? "WHS" : "RTL");
      const sale = await tx.sale.create({
        data: {
          channel,
          customerId,
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
              quantityGrams: p.quantityGrams,
              quantityLabel: p.quantityLabel,
              ratePerKg: p.ratePerKg,
              lineTotal: p.lineTotal,
              costPerKgAtSale: costByItem.get(p.itemId) ?? null,
            })),
          },
        },
      });

      for (const p of prepared) {
        await tx.item.update({
          where: { id: p.itemId },
          data: { currentStock: { decrement: p.quantityGrams } },
        });
      }

      if (paymentType === PaymentType.CREDIT && customerId) {
        await appendCustomerLedger(tx, {
          customerId,
          type: CustomerEntryType.SALE,
          amount: totalAmount,
          saleId: sale.id,
          note: `Sale ${invoiceNumber}`,
        });
        if (paidAmount.gt(0)) {
          const payment = await tx.payment.create({
            data: {
              direction: PaymentDirection.RECEIVABLE,
              customerId,
              saleId: sale.id,
              amount: paidAmount,
              method,
              note: `Paid at sale ${invoiceNumber}`,
            },
          });
          await appendCustomerLedger(tx, {
            customerId,
            type: CustomerEntryType.PAYMENT,
            amount: paidAmount.negated(),
            saleId: sale.id,
            paymentId: payment.id,
            note: `Payment for ${invoiceNumber}`,
          });
        }
      }

      return sale.id;
    }, { timeout: 20000, maxWait: 15000 });
  } catch (err) {
    if (err instanceof OverStockError) {
      return { overStock: { itemName: err.itemName, available: err.available, requested: err.requested } };
    }
    if (err instanceof CreditLimitError) {
      return { creditLimit: { customerName: err.customerName, limit: err.limit, current: err.current, afterSale: err.afterSale } };
    }
    return { error: err instanceof Error ? err.message : "Could not record the sale." };
  }

  revalidatePath("/admin/sales");
  revalidatePath("/admin/items");
  revalidatePath("/admin/customers");
  revalidatePath("/admin");
  redirect(`/admin/sales/${saleId}/invoice`);
}

class OverStockError extends Error {
  constructor(
    public itemName: string,
    public available: string,
    public requested: string,
  ) {
    super("Insufficient stock");
  }
}

class CreditLimitError extends Error {
  constructor(
    public customerName: string,
    public limit: string,
    public current: string,
    public afterSale: string,
  ) {
    super("Credit limit exceeded");
  }
}

/**
 * Soft-cancel a sale (§7.1). Never hard-deletes: the invoice number and line
 * history stay intact. Reverses stock for every line and, for a credit sale
 * that still carried receivable, appends a REFUND ledger entry that nets this
 * sale's outstanding balance back to zero. Idempotent-guarded: a sale can only
 * be cancelled once.
 */
export async function cancelSale(saleId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const reason = field(formData, "cancelReason") || null;

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({
      where: { id: saleId },
      include: { items: true },
    });
    if (sale.cancelledAt) throw new Error("This sale is already cancelled.");

    // Reverse stock for every line.
    for (const li of sale.items) {
      await tx.item.update({
        where: { id: li.itemId },
        data: { currentStock: { increment: li.quantityGrams } },
      });
    }

    // Reverse the customer's outstanding exposure from this sale, if any.
    const outstanding = sale.totalAmount.minus(sale.paidAmount);
    if (sale.paymentType === PaymentType.CREDIT && sale.customerId && outstanding.gt(0)) {
      await appendCustomerLedger(tx, {
        customerId: sale.customerId,
        type: CustomerEntryType.REFUND,
        amount: outstanding.negated(),
        saleId: sale.id,
        note: `Cancelled ${sale.invoiceNumber}${reason ? ` — ${reason}` : ""}`,
      });
    }

    await tx.sale.update({
      where: { id: saleId },
      data: { cancelledAt: new Date(), cancelReason: reason },
    });
  });

  revalidatePath("/admin/sales");
  revalidatePath(`/admin/sales/${saleId}/invoice`);
  revalidatePath("/admin/items");
  revalidatePath("/admin/customers");
  revalidatePath("/admin");
  redirect(`/admin/sales/${saleId}/invoice`);
}

/** Record a payment against a credit sale (settles customer receivable). */
export async function recordSalePayment(
  saleId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const amount = moneyField(formData, "amount");
  const method = parseMethod(formData);
  if (!amount || amount.lte(0)) return { error: "Enter a valid amount." };

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUniqueOrThrow({
        where: { id: saleId },
        select: { id: true, customerId: true, totalAmount: true, paidAmount: true, invoiceNumber: true, cancelledAt: true },
      });
      if (sale.cancelledAt) throw new Error("This sale is cancelled — no payments can be recorded.");
      if (!sale.customerId) throw new Error("This sale has no customer to settle against.");
      const remaining = sale.totalAmount.minus(sale.paidAmount);
      if (amount.gt(remaining)) throw new Error(`Amount exceeds the pending Rs. ${remaining.toString()}.`);

      const newPaid = sale.paidAmount.add(amount);
      const status = newPaid.equals(sale.totalAmount) ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

      const payment = await tx.payment.create({
        data: {
          direction: PaymentDirection.RECEIVABLE,
          customerId: sale.customerId,
          saleId,
          amount,
          method,
          note: `Payment for ${sale.invoiceNumber}`,
        },
      });
      await tx.sale.update({ where: { id: saleId }, data: { paidAmount: newPaid, status } });
      await appendCustomerLedger(tx, {
        customerId: sale.customerId,
        type: CustomerEntryType.PAYMENT,
        amount: amount.negated(),
        saleId,
        paymentId: payment.id,
        note: `Payment for ${sale.invoiceNumber}`,
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record the payment." };
  }

  revalidatePath(`/admin/sales/${saleId}/invoice`);
  revalidatePath("/admin/customers");
  revalidatePath("/admin");
  return { ok: true };
}
