import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Badge,
  EmptyState,
  LinkButton,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function statusBadge(status: string, overdue: boolean, isCredit: boolean, cancelled: boolean) {
  if (cancelled) return <Badge tone="slate">Cancelled</Badge>;
  if (!isCredit || status === "PAID") return <Badge tone="emerald">Paid</Badge>;
  if (overdue) return <Badge tone="red">Overdue</Badge>;
  if (status === "PARTIAL") return <Badge tone="amber">Partial</Badge>;
  return <Badge tone="amber">Unpaid</Badge>;
}

export default async function SalesPage() {
  const now = new Date();
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Sales History"
        description="All retail and wholesale sales."
        action={
          <div className="flex gap-2">
            <LinkButton href="/admin/sales/retail" variant="secondary">Retail</LinkButton>
            <LinkButton href="/admin/sales/wholesale">Wholesale</LinkButton>
          </div>
        }
      />

      {sales.length === 0 ? (
        <EmptyState
          title="No sales yet"
          hint="Record a retail or wholesale sale to get started."
          action={<LinkButton href="/admin/sales/retail">New retail sale</LinkButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th>Channel</Th>
              <Th>Customer</Th>
              <Th className="text-right">Total</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => {
              const overdue = s.status !== "PAID" && !!s.dueDate && s.dueDate < now;
              return (
                <tr key={s.id}>
                  <Td className="font-medium">
                    <Link href={`/admin/sales/${s.id}/invoice`} className="text-brand-700 hover:underline dark:text-brand-400">
                      {s.invoiceNumber}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(s.createdAt)}</Td>
                  <Td>{s.channel === "WHOLESALE" ? "Wholesale" : "Retail"}</Td>
                  <Td>{s.customer?.name ?? "Walk-in"}</Td>
                  <Td className={`text-right tabular-nums ${s.cancelledAt ? "text-slate-400 line-through" : ""}`}>{formatMoney(s.totalAmount)}</Td>
                  <Td>{statusBadge(s.status, overdue, s.paymentType === "CREDIT", !!s.cancelledAt)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
