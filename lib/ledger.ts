import { Prisma, SupplierEntryType, CustomerEntryType } from "@prisma/client";

/**
 * The two places a running balance moves: the SUPPLIER ledger (what we owe,
 * payable) and the CUSTOMER ledger (what we're owed, receivable). Every credit
 * purchase / sale / payment appends exactly one entry here, inside the SAME
 * prisma.$transaction as its domain write, so the cached `totalPayable` /
 * `totalReceivable` and the entry's `balanceAfter` snapshot can never drift.
 *
 * `amount` is signed:
 *   supplier: +PURCHASE increases payable, −PAYMENT decreases it
 *   customer: +SALE increases receivable, −PAYMENT decreases it
 *
 * `tx` is the transaction client — passing the outer `prisma` would break
 * atomicity, so callers must already be inside `$transaction`.
 */

export async function appendSupplierLedger(
  tx: Prisma.TransactionClient,
  entry: {
    supplierId: string;
    type: SupplierEntryType;
    amount: Prisma.Decimal; // signed
    purchaseId?: string | null;
    paymentId?: string | null;
    note?: string | null;
  },
) {
  const supplier = await tx.supplier.findUniqueOrThrow({
    where: { id: entry.supplierId },
    select: { totalPayable: true },
  });
  const balanceAfter = supplier.totalPayable.add(entry.amount);

  const created = await tx.supplierLedgerEntry.create({
    data: {
      supplierId: entry.supplierId,
      type: entry.type,
      amount: entry.amount,
      balanceAfter,
      purchaseId: entry.purchaseId ?? null,
      paymentId: entry.paymentId ?? null,
      note: entry.note ?? null,
    },
  });

  await tx.supplier.update({
    where: { id: entry.supplierId },
    data: { totalPayable: balanceAfter },
  });

  return created;
}

export async function appendCustomerLedger(
  tx: Prisma.TransactionClient,
  entry: {
    customerId: string;
    type: CustomerEntryType;
    amount: Prisma.Decimal; // signed
    saleId?: string | null;
    paymentId?: string | null;
    note?: string | null;
  },
) {
  const customer = await tx.customer.findUniqueOrThrow({
    where: { id: entry.customerId },
    select: { totalReceivable: true },
  });
  const balanceAfter = customer.totalReceivable.add(entry.amount);

  const created = await tx.customerLedgerEntry.create({
    data: {
      customerId: entry.customerId,
      type: entry.type,
      amount: entry.amount,
      balanceAfter,
      saleId: entry.saleId ?? null,
      paymentId: entry.paymentId ?? null,
      note: entry.note ?? null,
    },
  });

  await tx.customer.update({
    where: { id: entry.customerId },
    data: { totalReceivable: balanceAfter },
  });

  return created;
}

/**
 * Reserve the next sequential invoice number for a given prefix, INSIDE the
 * caller's transaction. Purchases use PUR-, retail sales RTL-, wholesale WHS-.
 * Counts existing rows of the same prefix — fine for a single-shop workload.
 */
export async function nextInvoiceNumber(
  tx: Prisma.TransactionClient,
  kind: "PUR" | "RTL" | "WHS",
): Promise<string> {
  const count =
    kind === "PUR"
      ? await tx.purchase.count()
      : await tx.sale.count({
          where: { channel: kind === "RTL" ? "RETAIL" : "WHOLESALE" },
        });
  return `${kind}-${String(count + 1).padStart(4, "0")}`;
}
