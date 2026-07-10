import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  Badge,
  BackLink,
  Card,
  Input,
  Label,
  PageHeader,
  Table,
  Td,
  Th,
  btnRowCls,
  inputCls,
} from "@/components/ui";
import RecordPaymentForm from "@/components/record-payment-form";
import { recordSalePayment } from "@/lib/actions/sales";
import { setCustomerItemRate, removeCustomerItemRate } from "@/lib/actions/customer-rates";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { waLink, receivableReminder } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function CustomerLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      ledgerEntries: { orderBy: { createdAt: "desc" }, take: 100 },
      sales: {
        where: { paymentType: "CREDIT", status: { not: "PAID" }, cancelledAt: null },
        orderBy: { createdAt: "asc" },
      },
      itemRates: { include: { item: { select: { name: true } } }, orderBy: { item: { name: "asc" } } },
    },
  });
  if (!customer) notFound();

  const items = await prisma.item.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true },
  });

  const now = new Date();
  const receivable = Number(customer.totalReceivable);

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/customers">Back to customers</BackLink>
        <PageHeader
          title={customer.name}
          description={`${customer.type === "WHOLESALE" ? "Wholesale buyer" : "Retail regular"}${customer.phone ? ` · ${customer.phone}` : ""}${customer.address ? ` · ${customer.address}` : ""}`}
          action={
            <Link href={`/admin/customers/${id}/edit`} className={btnRowCls}>
              Edit
            </Link>
          }
        />
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Outstanding receivable</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${receivable > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {formatMoney(receivable)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {customer.passwordHash ? (
              <Badge tone="emerald">Portal login enabled</Badge>
            ) : (
              <Badge tone="slate">No portal login</Badge>
            )}
            {customer.discountPercent && <Badge tone="brand">{customer.discountPercent.toString()}% standing discount</Badge>}
            {customer.creditLimit ? (
              <Badge tone="slate">Credit limit {formatMoney(customer.creditLimit)}</Badge>
            ) : (
              <Badge tone="slate">Unlimited credit</Badge>
            )}
          </div>
        </div>
        {receivable > 0 && customer.phone && (
          <a
            href={waLink(customer.phone, receivableReminder(customer.name, receivable.toFixed(0)))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-whatsapp-dark"
          >
            Send reminder
          </a>
        )}
      </Card>

      {/* Per-customer item rates (§7.2) */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Special rates</h2>
        <Card className="p-5">
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Negotiated per-item rates for this customer. Used first on wholesale sale lines, before the
            standing discount and the item&apos;s default wholesale price.
          </p>

          {customer.itemRates.length > 0 && (
            <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
              {customer.itemRates.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{r.item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-slate-700 dark:text-slate-300">{formatMoney(r.ratePerKg)}/kg</span>
                    <form action={removeCustomerItemRate.bind(null, id, r.itemId)}>
                      <button type="submit" className="text-xs font-medium text-red-500 hover:text-red-600">Remove</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form action={setCustomerItemRate.bind(null, id)} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <Label htmlFor="rateItem">Item</Label>
              <select id="rateItem" name="itemId" required className={inputCls}>
                <option value="">— Select item —</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} · {it.category}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <Label htmlFor="rateValue">Rate / kg</Label>
              <Input id="rateValue" name="ratePerKg" type="number" min="0.01" step="0.01" required />
            </div>
            <button type="submit" className={btnRowCls}>Save rate</button>
          </form>
        </Card>
      </div>

      {/* Unpaid credit sales with per-sale payment */}
      {customer.sales.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Unpaid credit sales</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {customer.sales.map((s) => {
              const remaining = s.totalAmount.minus(s.paidAmount);
              const overdue = s.dueDate && s.dueDate < now;
              return (
                <Card key={s.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/admin/sales/${s.id}/invoice`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">
                        {s.invoiceNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(s.createdAt)}
                        {s.dueDate && ` · due ${formatDate(s.dueDate)}`}
                      </p>
                    </div>
                    {overdue ? <Badge tone="red">Overdue</Badge> : <Badge tone="amber">Pending</Badge>}
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Remaining</span>
                    <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">{formatMoney(remaining)}</span>
                  </div>
                  <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <RecordPaymentForm action={recordSalePayment.bind(null, s.id)} remainingLabel={formatMoney(remaining)} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Ledger */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Ledger</h2>
        {customer.ledgerEntries.length === 0 ? (
          <Card className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No ledger entries yet — cash sales don't appear here.
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
              {customer.ledgerEntries.map((e) => (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(e.createdAt)}</Td>
                  <Td>
                    {e.type === "SALE" ? (
                      <Badge tone="amber">Sale</Badge>
                    ) : e.type === "REFUND" ? (
                      <Badge tone="slate">Refund</Badge>
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
