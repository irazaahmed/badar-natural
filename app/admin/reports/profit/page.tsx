import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Card, Table, Th, Td, EmptyState } from "@/components/ui";
import { ReportFilters } from "@/components/report-filters";
import { formatMoney } from "@/lib/format";
import { resolveRange } from "@/lib/report-range";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profit report — Badar Natural Foods" };

const KG = new Prisma.Decimal(1000);

export default async function ProfitReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { gte, lt, fromInput, toInput, label } = resolveRange(sp.from, sp.to);

  // Every sold line in range from a non-cancelled sale. COGS uses the cost
  // snapshotted at sale time (§7.3) so it stays accurate if prices change later.
  const lines = await prisma.saleItem.findMany({
    where: { sale: { createdAt: { gte, lt }, cancelledAt: null } },
    include: { item: { select: { name: true } } },
  });

  type Row = { name: string; qtyKg: Prisma.Decimal; revenue: Prisma.Decimal; cost: Prisma.Decimal };
  const byItem = new Map<string, Row>();
  let revenue = new Prisma.Decimal(0);
  let cost = new Prisma.Decimal(0);
  let costKnown = true;

  for (const li of lines) {
    const kg = li.quantityGrams.div(KG);
    const lineCost = li.costPerKgAtSale != null ? kg.mul(li.costPerKgAtSale) : new Prisma.Decimal(0);
    if (li.costPerKgAtSale == null) costKnown = false;
    revenue = revenue.add(li.lineTotal);
    cost = cost.add(lineCost);
    const key = li.itemId;
    const row = byItem.get(key) ?? { name: li.item.name, qtyKg: new Prisma.Decimal(0), revenue: new Prisma.Decimal(0), cost: new Prisma.Decimal(0) };
    row.qtyKg = row.qtyKg.add(kg);
    row.revenue = row.revenue.add(li.lineTotal);
    row.cost = row.cost.add(lineCost);
    byItem.set(key, row);
  }

  const rows = [...byItem.values()].sort((a, b) => b.revenue.minus(b.cost).comparedTo(a.revenue.minus(a.cost)));
  const profit = revenue.minus(cost);
  const margin = revenue.gt(0) ? profit.div(revenue).mul(100) : new Prisma.Decimal(0);

  return (
    <div>
      <BackLink href="/admin/reports">Back to reports</BackLink>
      <PageHeader title="Profit report" description={`Revenue − cost of goods sold · ${label}`} />
      <ReportFilters action="/admin/reports/profit" fromInput={fromInput} toInput={toInput} />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Revenue</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(revenue)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Cost of goods</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(cost)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Gross profit</p>
          <p className={`mt-1.5 text-xl font-bold tabular-nums ${profit.gte(0) ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatMoney(profit)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Margin</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{margin.toFixed(1)}%</p>
        </Card>
      </div>

      {!costKnown && (
        <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Some lines have no recorded purchase cost (item bought before cost tracking, or never purchased) — their cost counts as 0, so profit may read high.
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState title="No sales in this period" hint="Try a different date range." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th className="text-right">Qty (kg/L)</Th>
              <Th className="text-right">Revenue</Th>
              <Th className="text-right">Cost</Th>
              <Th className="text-right">Profit</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = r.revenue.minus(r.cost);
              return (
                <tr key={r.name}>
                  <Td className="font-medium">{r.name}</Td>
                  <Td className="text-right tabular-nums">{r.qtyKg.toFixed(2)}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(r.revenue)}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(r.cost)}</Td>
                  <Td className={`text-right tabular-nums ${p.gte(0) ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatMoney(p)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
