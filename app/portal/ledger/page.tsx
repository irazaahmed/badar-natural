import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalLedger() {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!customerId) redirect("/login");

  const entries = await prisma.customerLedgerEntry.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Ledger / کھاتہ
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every sale and payment on your account, most recent first.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState title="No ledger activity yet" hint="Your credit sales and payments will appear here." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Detail</Th>
              <Th className="text-right">Sale</Th>
              <Th className="text-right">Payment</Th>
              <Th className="text-right">Balance</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const isSale = e.type === "SALE";
              return (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap text-slate-500">{formatDate(e.createdAt)}</Td>
                  <Td>
                    <Badge tone={isSale ? "slate" : "emerald"}>{isSale ? "Sale" : "Payment"}</Badge>
                    {e.note && <span className="ml-2 text-slate-500">{e.note}</span>}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {isSale ? formatMoney(e.amount) : "—"}
                  </Td>
                  <Td className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {isSale ? "—" : formatMoney(e.amount.abs())}
                  </Td>
                  <Td className="text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatMoney(e.balanceAfter)}
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
