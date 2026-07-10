import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Card } from "@/components/ui";
import { ReportFilters } from "@/components/report-filters";
import { formatMoney } from "@/lib/format";
import { resolveRange } from "@/lib/report-range";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cash report — Badar Natural Foods" };

export default async function CashReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { gte, lt, fromInput, toInput, label } = resolveRange(sp.from, sp.to);
  const range = { gte, lt };

  // Cash IN  = cash sales + cash received settling credit sales.
  // Cash OUT = cash purchases + cash paid settling credit purchases.
  // (Cash sales never create a Payment row, so combining avoids double-counting;
  //  cash purchases DO, so on that side we only add CREDIT-purchase settlements.)
  const [cashSales, creditSaleCashIn, cashPurchases, creditPurchaseCashOut] = await Promise.all([
    prisma.sale.aggregate({
      where: { paymentType: "CASH", cancelledAt: null, createdAt: range },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: { direction: "RECEIVABLE", method: "CASH", createdAt: range, sale: { paymentType: "CREDIT" } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.purchase.aggregate({
      where: { paymentType: "CASH", createdAt: range },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: { direction: "PAYABLE", method: "CASH", createdAt: range, purchase: { paymentType: "CREDIT" } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const inSales = cashSales._sum.totalAmount ?? new Prisma.Decimal(0);
  const inSettle = creditSaleCashIn._sum.amount ?? new Prisma.Decimal(0);
  const outPurch = cashPurchases._sum.totalAmount ?? new Prisma.Decimal(0);
  const outSettle = creditPurchaseCashOut._sum.amount ?? new Prisma.Decimal(0);
  const cashIn = inSales.add(inSettle);
  const cashOut = outPurch.add(outSettle);
  const net = cashIn.minus(cashOut);

  const Row = ({ label: l, value, count }: { label: string; value: Prisma.Decimal; count?: number }) => (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm last:border-0 dark:border-slate-800">
      <span className="text-slate-600 dark:text-slate-300">{l}{count != null ? ` (${count})` : ""}</span>
      <span className="tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(value)}</span>
    </div>
  );

  return (
    <div>
      <BackLink href="/admin/reports">Back to reports</BackLink>
      <PageHeader title="Cash report" description={`Cash in, cash out and net position · ${label}`} />
      <ReportFilters action="/admin/reports/cash" fromInput={fromInput} toInput={toInput} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Cash in</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatMoney(cashIn)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Cash out</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">{formatMoney(cashOut)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Net cash</p>
          <p className={`mt-1.5 text-2xl font-bold tabular-nums ${net.gte(0) ? "text-slate-900 dark:text-slate-100" : "text-red-600 dark:text-red-400"}`}>{formatMoney(net)}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">Cash in</h2>
          <Row label="Cash sales" value={inSales} count={cashSales._count._all} />
          <Row label="Cash received on credit sales" value={inSettle} count={creditSaleCashIn._count._all} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">Cash out</h2>
          <Row label="Cash purchases" value={outPurch} count={cashPurchases._count._all} />
          <Row label="Cash paid on credit purchases" value={outSettle} count={creditPurchaseCashOut._count._all} />
        </Card>
      </div>
    </div>
  );
}
