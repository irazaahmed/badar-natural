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

function statusBadge(status: string, overdue: boolean) {
  if (status === "PAID") return <Badge tone="emerald">Paid</Badge>;
  if (overdue) return <Badge tone="red">Overdue</Badge>;
  if (status === "PARTIAL") return <Badge tone="amber">Partial</Badge>;
  return <Badge tone="amber">Unpaid</Badge>;
}

export default async function PurchasesPage() {
  const now = new Date();
  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { supplier: { select: { name: true } }, _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Bulk stock bought from suppliers."
        action={<LinkButton href="/admin/purchases/new">+ New purchase</LinkButton>}
      />

      {purchases.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          hint="Record your first bulk purchase to bring stock in."
          action={<LinkButton href="/admin/purchases/new">+ New purchase</LinkButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th>Supplier</Th>
              <Th className="text-right">Items</Th>
              <Th className="text-right">Total</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => {
              const overdue = p.status !== "PAID" && !!p.dueDate && p.dueDate < now;
              return (
                <tr key={p.id}>
                  <Td className="font-medium">
                    <Link href={`/admin/purchases/${p.id}`} className="text-brand-700 hover:underline dark:text-brand-400">
                      {p.invoiceNumber}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(p.createdAt)}</Td>
                  <Td>{p.supplier.name}</Td>
                  <Td className="text-right tabular-nums">{p._count.items}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(p.totalAmount)}</Td>
                  <Td>{p.paymentType === "CASH" ? "Cash" : "Credit"}</Td>
                  <Td>{statusBadge(p.status, overdue)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
