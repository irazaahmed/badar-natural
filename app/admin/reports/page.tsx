import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { resolveRange } from "@/lib/report-range";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports — Badar Natural Foods" };

const REPORTS = [
  { href: "/admin/reports/sales", title: "Sales report", desc: "Retail + wholesale over any date range, by channel." },
  { href: "/admin/reports/profit", title: "Profit report", desc: "Revenue minus cost of goods sold for the period." },
  { href: "/admin/reports/items", title: "Best & least selling", desc: "Items ranked by quantity and revenue." },
  { href: "/admin/reports/cash", title: "Cash report", desc: "All cash in and out — net cash position." },
  { href: "/admin/reports/credit", title: "Credit report", desc: "Outstanding payables & receivables, overdue first. CSV export." },
];

export default async function ReportsPage() {
  // This-month snapshot for the header, excluding cancelled sales.
  const { gte, lt, label } = resolveRange();
  const [salesAgg, payable, receivable] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte, lt }, cancelledAt: null },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.supplier.aggregate({ _sum: { totalPayable: true } }),
    prisma.customer.aggregate({ _sum: { totalReceivable: true } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="Sales, profit, cash and credit — for any period." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Sales this month</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(salesAgg._sum.totalAmount ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-400">{salesAgg._count._all} sales · {label}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total payable</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatMoney(payable._sum.totalPayable ?? 0)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total receivable</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatMoney(receivable._sum.totalReceivable ?? 0)}</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="h-full p-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{r.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{r.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
