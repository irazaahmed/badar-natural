import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalInvoices() {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!customerId) redirect("/login");

  const sales = await prisma.sale.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const now = new Date();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Invoices / رسیدیں
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tap an invoice to view, print or download it.
        </p>
      </div>

      {sales.length === 0 ? (
        <EmptyState title="No invoices yet" hint="Your bills will appear here once you make a purchase." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th className="text-right">Total</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => {
              const overdue = s.status !== "PAID" && !!s.dueDate && s.dueDate < now;
              return (
                <tr key={s.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{s.invoiceNumber}</Td>
                  <Td className="whitespace-nowrap text-slate-500">{formatDate(s.createdAt)}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(s.totalAmount)}</Td>
                  <Td>
                    {s.paymentType === "CASH" || s.status === "PAID" ? (
                      <Badge tone="emerald">Paid</Badge>
                    ) : overdue ? (
                      <Badge tone="red">Overdue</Badge>
                    ) : (
                      <Badge tone="amber">{s.status === "PARTIAL" ? "Partial" : "Unpaid"}</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/portal/invoices/${s.id}`}
                      className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
                    >
                      View →
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
