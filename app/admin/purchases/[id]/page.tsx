import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  Badge,
  BackLink,
  Card,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import RecordPaymentForm from "@/components/record-payment-form";
import { recordPurchasePayment } from "@/lib/actions/purchases";
import { formatMoney, formatDate } from "@/lib/format";
import { formatKg } from "@/lib/units";

export const dynamic = "force-dynamic";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { item: { select: { name: true, baseUnit: true } } } },
    },
  });
  if (!purchase) notFound();

  const remaining = purchase.totalAmount.minus(purchase.paidAmount);
  const overdue = purchase.status !== "PAID" && !!purchase.dueDate && purchase.dueDate < new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <BackLink href="/admin/purchases">Back to purchases</BackLink>
        <PageHeader
          title={`Purchase ${purchase.invoiceNumber}`}
          description={`${formatDate(purchase.createdAt)} · `}
          action={
            purchase.status === "PAID" ? (
              <Badge tone="emerald">Paid</Badge>
            ) : overdue ? (
              <Badge tone="red">Overdue</Badge>
            ) : (
              <Badge tone="amber">{purchase.status === "PARTIAL" ? "Partial" : "Unpaid"}</Badge>
            )
          }
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap justify-between gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Supplier</p>
            <Link href={`/admin/suppliers/${purchase.supplierId}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">
              {purchase.supplier.name}
            </Link>
            {purchase.supplier.phone && <p className="text-xs text-slate-500 dark:text-slate-400">{purchase.supplier.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-slate-500 dark:text-slate-400">Payment</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {purchase.paymentType === "CASH" ? "Cash" : `Credit${purchase.dueDate ? ` · due ${formatDate(purchase.dueDate)}` : ""}`}
            </p>
          </div>
        </div>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Item</Th>
            <Th className="text-right">Qty</Th>
            <Th className="text-right">Rate /kg</Th>
            <Th className="text-right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {purchase.items.map((li) => (
            <tr key={li.id}>
              <Td className="font-medium text-slate-900 dark:text-slate-100">{li.item.name}</Td>
              <Td className="text-right tabular-nums">{formatKg(Number(li.quantityKg), li.item.baseUnit === "ML" ? "ML" : "GRAM")}</Td>
              <Td className="text-right tabular-nums">{formatMoney(li.ratePerKg)}</Td>
              <Td className="text-right tabular-nums">{formatMoney(li.lineTotal)}</Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <Td colSpan={3} className="text-right font-semibold">Total</Td>
            <Td className="text-right font-bold tabular-nums">{formatMoney(purchase.totalAmount)}</Td>
          </tr>
          <tr>
            <Td colSpan={3} className="text-right text-slate-500 dark:text-slate-400">Paid</Td>
            <Td className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatMoney(purchase.paidAmount)}</Td>
          </tr>
          {remaining.gt(0) && (
            <tr>
              <Td colSpan={3} className="text-right text-slate-500 dark:text-slate-400">Payable</Td>
              <Td className="text-right font-semibold tabular-nums text-amber-600 dark:text-amber-400">{formatMoney(remaining)}</Td>
            </tr>
          )}
        </tfoot>
      </Table>

      {remaining.gt(0) && (
        <Card className="p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Record a payment</h2>
          <RecordPaymentForm action={recordPurchasePayment.bind(null, id)} remainingLabel={formatMoney(remaining)} />
        </Card>
      )}
    </div>
  );
}
