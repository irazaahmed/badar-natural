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
  btnRowCls,
} from "@/components/ui";
import RecordPaymentForm from "@/components/record-payment-form";
import { recordPurchasePayment } from "@/lib/actions/purchases";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SupplierLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      ledgerEntries: { orderBy: { createdAt: "desc" }, take: 100 },
      purchases: {
        where: { paymentType: "CREDIT", status: { not: "PAID" } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!supplier) notFound();

  const now = new Date();
  const payable = Number(supplier.totalPayable);

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/suppliers">Back to suppliers</BackLink>
        <PageHeader
          title={supplier.name}
          description={`${supplier.phone ?? ""}${supplier.phone && supplier.address ? " · " : ""}${supplier.address ?? ""}` || "Wholesaler"}
          action={
            <Link href={`/admin/suppliers/${id}/edit`} className={btnRowCls}>
              Edit
            </Link>
          }
        />
      </div>

      <Card className="p-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">Outstanding payable</p>
        <p className={`mt-1 text-2xl font-bold tabular-nums ${payable > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {formatMoney(payable)}
        </p>
      </Card>

      {supplier.purchases.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Unpaid credit purchases</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {supplier.purchases.map((p) => {
              const remaining = p.totalAmount.minus(p.paidAmount);
              const overdue = p.dueDate && p.dueDate < now;
              return (
                <Card key={p.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/admin/purchases/${p.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">
                        {p.invoiceNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(p.createdAt)}
                        {p.dueDate && ` · due ${formatDate(p.dueDate)}`}
                      </p>
                    </div>
                    {overdue ? <Badge tone="red">Overdue</Badge> : <Badge tone="amber">Pending</Badge>}
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Remaining</span>
                    <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">{formatMoney(remaining)}</span>
                  </div>
                  <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <RecordPaymentForm action={recordPurchasePayment.bind(null, p.id)} remainingLabel={formatMoney(remaining)} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Ledger</h2>
        {supplier.ledgerEntries.length === 0 ? (
          <Card className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No ledger entries yet.
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Note</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Balance</Th>
              </tr>
            </thead>
            <tbody>
              {supplier.ledgerEntries.map((e) => (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(e.createdAt)}</Td>
                  <Td>
                    {e.type === "PURCHASE" ? (
                      <Badge tone="amber">Purchase</Badge>
                    ) : (
                      <Badge tone="emerald">Payment</Badge>
                    )}
                  </Td>
                  <Td>{e.note ?? "—"}</Td>
                  <Td className={`text-right tabular-nums ${Number(e.amount) >= 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {Number(e.amount) >= 0 ? "+" : "−"}
                    {formatMoney(Math.abs(Number(e.amount)))}
                  </Td>
                  <Td className="text-right font-medium tabular-nums">{formatMoney(e.balanceAfter)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
