import Link from "next/link";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Table, Th, Td, EmptyState } from "@/components/ui";
import { ReportFilters } from "@/components/report-filters";
import { formatMoney } from "@/lib/format";
import { resolveRange } from "@/lib/report-range";

export const dynamic = "force-dynamic";
export const metadata = { title: "Best & least selling — Badar Natural Foods" };

const KG = new Prisma.Decimal(1000);

export default async function ItemsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; by?: string }>;
}) {
  const sp = await searchParams;
  const { gte, lt, fromInput, toInput, label } = resolveRange(sp.from, sp.to);
  const by = sp.by === "revenue" ? "revenue" : "qty";

  const lines = await prisma.saleItem.findMany({
    where: { sale: { createdAt: { gte, lt }, cancelledAt: null } },
    include: { item: { select: { name: true, category: true } } },
  });

  type Row = { name: string; category: string; qtyKg: Prisma.Decimal; revenue: Prisma.Decimal };
  const byItem = new Map<string, Row>();
  for (const li of lines) {
    const row = byItem.get(li.itemId) ?? { name: li.item.name, category: li.item.category, qtyKg: new Prisma.Decimal(0), revenue: new Prisma.Decimal(0) };
    row.qtyKg = row.qtyKg.add(li.quantityGrams.div(KG));
    row.revenue = row.revenue.add(li.lineTotal);
    byItem.set(li.itemId, row);
  }
  const rows = [...byItem.values()].sort((a, b) =>
    by === "revenue" ? b.revenue.comparedTo(a.revenue) : b.qtyKg.comparedTo(a.qtyKg),
  );

  return (
    <div>
      <BackLink href="/admin/reports">Back to reports</BackLink>
      <PageHeader title="Best & least selling" description={`Ranked by ${by === "revenue" ? "revenue" : "quantity"} · ${label}`} />
      <ReportFilters action="/admin/reports/items" fromInput={fromInput} toInput={toInput} />

      <div className="mb-4 flex gap-2 text-sm">
        <Link href={`/admin/reports/items?from=${fromInput}&to=${toInput}&by=qty`} className={`rounded-full px-4 py-1.5 font-semibold ${by === "qty" ? "bg-brand-300 text-navy-900" : "border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"}`}>By quantity</Link>
        <Link href={`/admin/reports/items?from=${fromInput}&to=${toInput}&by=revenue`} className={`rounded-full px-4 py-1.5 font-semibold ${by === "revenue" ? "bg-brand-300 text-navy-900" : "border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"}`}>By revenue</Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No sales in this period" hint="Try a different date range." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Item</Th>
              <Th>Category</Th>
              <Th className="text-right">Qty sold (kg/L)</Th>
              <Th className="text-right">Revenue</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name}>
                <Td className="tabular-nums text-slate-400">{i + 1}</Td>
                <Td className="font-medium">{r.name}</Td>
                <Td>{r.category}</Td>
                <Td className="text-right tabular-nums">{r.qtyKg.toFixed(2)}</Td>
                <Td className="text-right tabular-nums">{formatMoney(r.revenue)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <p className="mt-3 text-xs text-slate-400">Top rows are the best sellers; the lowest rows are the least selling.</p>
    </div>
  );
}
