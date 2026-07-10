import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!customerId) redirect("/login");

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) redirect("/login");

  const [unpaidCount, overdueCount, totalInvoices] = await Promise.all([
    prisma.sale.count({ where: { customerId, status: { in: ["UNPAID", "PARTIAL"] } } }),
    prisma.sale.count({
      where: { customerId, status: { in: ["UNPAID", "PARTIAL"] }, dueDate: { lt: new Date() } },
    }),
    prisma.sale.count({ where: { customerId } }),
  ]);

  const owes = customer.totalReceivable.gt(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {customer.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your account with Badar Natural Foods — balance, ledger and invoices.
        </p>
      </div>

      {/* Outstanding balance — the headline number */}
      <Card className={`p-6 ${owes ? "ring-1 ring-amber-200 dark:ring-amber-500/20" : ""}`}>
        <p className="text-sm text-slate-500 dark:text-slate-400">Outstanding balance / باقی رقم</p>
        <p
          className={`mt-1 font-display text-4xl font-bold tabular-nums ${
            owes ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {formatMoney(customer.totalReceivable)}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {owes
            ? `You have ${unpaidCount} unpaid invoice${unpaidCount === 1 ? "" : "s"}${
                overdueCount > 0 ? `, ${overdueCount} overdue` : ""
              }.`
            : "You're all cleared — nothing outstanding. Shukriya!"}
        </p>
      </Card>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total invoices</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{totalInvoices}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Unpaid</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{unpaidCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Overdue</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {overdueCount}
            {overdueCount > 0 && <Badge tone="red">Action needed</Badge>}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/portal/invoices"
          className="inline-flex items-center gap-2 rounded-full bg-brand-300 px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-brand-200"
        >
          View invoices
        </Link>
        <Link
          href="/portal/ledger"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          See full ledger
        </Link>
      </div>

      <p className="text-xs text-slate-400">
        Questions about your account? Call {" "}
        <a href="tel:+923123546488" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
          +92 312 3546488
        </a>
        .
      </p>
    </div>
  );
}
