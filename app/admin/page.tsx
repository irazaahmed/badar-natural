import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { formatQty } from "@/lib/units";

export const dynamic = "force-dynamic";

/** Start of today in Pakistan Standard Time (UTC+5, no DST), as a UTC Date. */
function startOfTodayPK(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${parts}T00:00:00+05:00`);
}

function StatCard({
  label,
  value,
  sub,
  href,
  tone = "brand",
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  href?: string;
  tone?: "brand" | "amber" | "emerald";
}) {
  const inner = (
    <Card className="h-full px-5 py-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100`}>{value}</p>
      {sub && <div className="mt-1 text-sm">{sub}</div>}
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function DashboardPage() {
  const todayStart = startOfTodayPK();
  const now = new Date();

  const [retailToday, wholesaleToday, payableAgg, receivableAgg, overdueSuppliers, overdueCustomers, lowStock] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { channel: "RETAIL", createdAt: { gte: todayStart } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.sale.aggregate({
        where: { channel: "WHOLESALE", createdAt: { gte: todayStart } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.supplier.aggregate({ _sum: { totalPayable: true } }),
      prisma.customer.aggregate({ _sum: { totalReceivable: true } }),
      prisma.purchase.groupBy({
        by: ["supplierId"],
        where: { status: { not: "PAID" }, dueDate: { lt: now } },
        _count: { _all: true },
      }),
      prisma.sale.groupBy({
        by: ["customerId"],
        where: { status: { not: "PAID" }, dueDate: { lt: now }, customerId: { not: null } },
        _count: { _all: true },
      }),
      prisma.$queryRaw<Array<{ id: string; name: string; currentStock: string; lowStockThreshold: string; baseUnit: string }>>`
        SELECT id, name, "currentStock", "lowStockThreshold", "baseUnit"
        FROM "Item"
        WHERE "isActive" = true AND "currentStock" <= "lowStockThreshold"
        ORDER BY "currentStock" ASC
        LIMIT 12
      `,
    ]);

  const totalPayable = Number(payableAgg._sum.totalPayable ?? 0);
  const totalReceivable = Number(receivableAgg._sum.totalReceivable ?? 0);

  const quickActions = [
    { href: "/admin/sales/retail", label: "New Retail Sale" },
    { href: "/admin/sales/wholesale", label: "New Wholesale Sale" },
    { href: "/admin/purchases/new", label: "New Purchase" },
    { href: "/admin/suppliers", label: "Record Payment" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Today at a glance across retail, wholesale and stock." />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((a, i) => (
          <Link
            key={a.href}
            href={a.href}
            className={
              i === 0
                ? "rounded-full bg-brand-300 px-5 py-2.5 text-sm font-semibold text-navy-900 shadow-md shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-200"
                : "rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            }
          >
            {a.label}
          </Link>
        ))}
      </div>

      {/* Stat grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Retail sales today"
          value={formatMoney(retailToday._sum.totalAmount ?? 0)}
          sub={<span className="text-slate-500 dark:text-slate-400">{retailToday._count._all} sales</span>}
          href="/admin/sales"
        />
        <StatCard
          label="Wholesale sales today"
          value={formatMoney(wholesaleToday._sum.totalAmount ?? 0)}
          sub={<span className="text-slate-500 dark:text-slate-400">{wholesaleToday._count._all} sales</span>}
          href="/admin/sales"
        />
        <StatCard
          label="Total payable"
          value={formatMoney(totalPayable)}
          sub={
            overdueSuppliers.length > 0 ? (
              <Badge tone="red">{overdueSuppliers.length} supplier(s) overdue</Badge>
            ) : (
              <span className="text-slate-400">No overdue</span>
            )
          }
          href="/admin/suppliers"
        />
        <StatCard
          label="Total receivable"
          value={formatMoney(totalReceivable)}
          sub={
            overdueCustomers.length > 0 ? (
              <Badge tone="red">{overdueCustomers.length} customer(s) overdue</Badge>
            ) : (
              <span className="text-slate-400">No overdue</span>
            )
          }
          href="/admin/customers"
        />
      </div>

      {/* Low stock */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Low stock</h2>
        {lowStock.length === 0 ? (
          <Card className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Everything is above its threshold. 👍
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((it) => {
              const stock = Number(it.currentStock);
              return (
                <Link key={it.id} href={`/admin/items/${it.id}/edit`}>
                  <Card className="flex items-center justify-between px-4 py-3">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{it.name}</span>
                    {stock < 0 ? (
                      <Badge tone="red">{formatQty(stock, it.baseUnit === "ML" ? "ML" : "GRAM")}</Badge>
                    ) : (
                      <Badge tone="amber">{formatQty(stock, it.baseUnit === "ML" ? "ML" : "GRAM")}</Badge>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
