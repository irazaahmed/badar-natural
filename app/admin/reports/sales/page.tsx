import Link from "next/link";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { ReportFilters } from "@/components/report-filters";
import { formatMoney, formatDate } from "@/lib/format";
import { resolveRange } from "@/lib/report-range";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sales report — Badar Natural Foods" };

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; channel?: string }>;
}) {
  const sp = await searchParams;
  const { gte, lt, fromInput, toInput, label } = resolveRange(sp.from, sp.to);
  const channel = sp.channel === "RETAIL" || sp.channel === "WHOLESALE" ? sp.channel : "all";

  const where: Prisma.SaleWhereInput = {
    createdAt: { gte, lt },
    cancelledAt: null,
    ...(channel === "all" ? {} : { channel }),
  };

  const [sales, totals] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    prisma.sale.groupBy({
      by: ["channel"],
      where: { createdAt: { gte, lt }, cancelledAt: null },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
  ]);

  const retail = totals.find((t) => t.channel === "RETAIL");
  const wholesale = totals.find((t) => t.channel === "WHOLESALE");
  const grandTotal = sales.reduce((s, x) => s.add(x.totalAmount), new Prisma.Decimal(0));

  return (
    <div>
      <BackLink href="/admin/reports">Back to reports</BackLink>
      <PageHeader title="Sales report" description={`Retail + wholesale · ${label}`} />
      <ReportFilters action="/admin/reports/sales" fromInput={fromInput} toInput={toInput} channel={channel} showChannel />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Retail</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(retail?._sum.totalAmount ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-400">{retail?._count._all ?? 0} sales</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Wholesale</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(wholesale?._sum.totalAmount ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-400">{wholesale?._count._all ?? 0} sales</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Combined (filtered)</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-brand-700 dark:text-brand-400">{formatMoney(grandTotal)}</p>
          <p className="mt-1 text-xs text-slate-400">{sales.length} sales</p>
        </Card>
      </div>

      {sales.length === 0 ? (
        <EmptyState title="No sales in this period" hint="Try a different date range or channel." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th>Channel</Th>
              <Th>Customer</Th>
              <Th>Payment</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <Td className="font-medium">
                  <Link href={`/admin/sales/${s.id}/invoice`} className="text-brand-700 hover:underline dark:text-brand-400">{s.invoiceNumber}</Link>
                </Td>
                <Td className="whitespace-nowrap">{formatDate(s.createdAt)}</Td>
                <Td>{s.channel === "WHOLESALE" ? "Wholesale" : "Retail"}</Td>
                <Td>{s.customer?.name ?? "Walk-in"}</Td>
                <Td>{s.paymentType === "CASH" ? <Badge tone="emerald">Cash</Badge> : <Badge tone="amber">Credit</Badge>}</Td>
                <Td className="text-right tabular-nums">{formatMoney(s.totalAmount)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
