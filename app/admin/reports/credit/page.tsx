import Link from "next/link";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Card, Table, Th, Td, Badge, EmptyState, btnPrimaryCls } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Credit report — Badar Natural Foods" };

/** Earliest unpaid due date across a set of credit docs, + overdue flag. */
function earliestDue(docs: { dueDate: Date | null }[], now: Date) {
  const dues = docs.map((d) => d.dueDate).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime());
  const oldest = dues[0] ?? null;
  return { oldest, overdue: !!oldest && oldest < now };
}

export default async function CreditReportPage() {
  const now = new Date();

  const [suppliers, customers] = await Promise.all([
    prisma.supplier.findMany({
      where: { totalPayable: { gt: 0 } },
      include: { purchases: { where: { status: { not: "PAID" } }, select: { dueDate: true } } },
    }),
    prisma.customer.findMany({
      where: { totalReceivable: { gt: 0 } },
      include: { sales: { where: { status: { not: "PAID" }, paymentType: "CREDIT", cancelledAt: null }, select: { dueDate: true } } },
    }),
  ]);

  const payables = suppliers
    .map((s) => ({ id: s.id, name: s.name, phone: s.phone, amount: s.totalPayable, ...earliestDue(s.purchases, now) }))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.oldest?.getTime() ?? Infinity) - (b.oldest?.getTime() ?? Infinity));

  const receivables = customers
    .map((c) => ({ id: c.id, name: c.name, phone: c.phone, amount: c.totalReceivable, ...earliestDue(c.sales, now) }))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.oldest?.getTime() ?? Infinity) - (b.oldest?.getTime() ?? Infinity));

  const totalPayable = payables.reduce((s, x) => s + Number(x.amount), 0);
  const totalReceivable = receivables.reduce((s, x) => s + Number(x.amount), 0);

  return (
    <div className="space-y-8">
      <div>
        <BackLink href="/admin/reports">Back to reports</BackLink>
        <PageHeader
          title="Credit report"
          description="All outstanding payables and receivables — overdue first."
          action={
            <a href="/admin/reports/credit/export" className={btnPrimaryCls}>Download CSV</a>
          }
        />
      </div>

      {/* Payables */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Payables (suppliers) — {formatMoney(totalPayable)}
        </h2>
        {payables.length === 0 ? (
          <EmptyState title="No outstanding payables" hint="You don't owe any supplier right now." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Supplier</Th>
                <Th>Phone</Th>
                <Th>Oldest due</Th>
                <Th>Status</Th>
                <Th className="text-right">Payable</Th>
              </tr>
            </thead>
            <tbody>
              {payables.map((p) => (
                <tr key={p.id}>
                  <Td className="font-medium">
                    <Link href={`/admin/suppliers/${p.id}`} className="text-brand-700 hover:underline dark:text-brand-400">{p.name}</Link>
                  </Td>
                  <Td>{p.phone ?? "—"}</Td>
                  <Td>{p.oldest ? formatDate(p.oldest) : "—"}</Td>
                  <Td>{p.overdue ? <Badge tone="red">Overdue</Badge> : <Badge tone="amber">Pending</Badge>}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(p.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Receivables */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Receivables (customers) — {formatMoney(totalReceivable)}
        </h2>
        {receivables.length === 0 ? (
          <EmptyState title="No outstanding receivables" hint="No customer owes you right now." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Phone</Th>
                <Th>Oldest due</Th>
                <Th>Status</Th>
                <Th className="text-right">Receivable</Th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((r) => (
                <tr key={r.id}>
                  <Td className="font-medium">
                    <Link href={`/admin/customers/${r.id}`} className="text-brand-700 hover:underline dark:text-brand-400">{r.name}</Link>
                  </Td>
                  <Td>{r.phone ?? "—"}</Td>
                  <Td>{r.oldest ? formatDate(r.oldest) : "—"}</Td>
                  <Td>{r.overdue ? <Badge tone="red">Overdue</Badge> : <Badge tone="amber">Pending</Badge>}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(r.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
