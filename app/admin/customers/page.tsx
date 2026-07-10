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
  btnRowCls,
} from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import { formatMoney } from "@/lib/format";
import { deleteCustomer } from "@/lib/actions/customers";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const now = new Date();
  const [customers, overdue] = await Promise.all([
    prisma.customer.findMany({ orderBy: [{ totalReceivable: "desc" }, { name: "asc" }] }),
    prisma.sale.groupBy({
      by: ["customerId"],
      where: { status: { not: "PAID" }, dueDate: { lt: now }, customerId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const overdueSet = new Set(overdue.map((o) => o.customerId));
  const totalReceivable = customers.reduce((s, c) => s + Number(c.totalReceivable), 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Wholesale buyers and tracked regulars. Outstanding = receivable owed to you."
        action={<LinkButton href="/admin/customers/new">+ Add customer</LinkButton>}
      />

      <div className="mb-5 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-brand-50 px-4 py-1.5 font-medium text-brand-800 ring-1 ring-inset ring-brand-200 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20">
          Total receivable: {formatMoney(totalReceivable)}
        </span>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          hint="Add a wholesale buyer, or they're created automatically from a credit sale."
          action={<LinkButton href="/admin/customers/new">+ Add customer</LinkButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Phone</Th>
              <Th className="text-right">Receivable</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const due = Number(c.totalReceivable);
              return (
                <tr key={c.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">
                    <Link href={`/admin/customers/${c.id}`} className="hover:text-brand-700 hover:underline dark:hover:text-brand-400">
                      {c.name}
                    </Link>
                    {overdueSet.has(c.id) && <span className="ml-2"><Badge tone="red">Overdue</Badge></span>}
                  </Td>
                  <Td>{c.type === "WHOLESALE" ? "Wholesale" : "Retail regular"}</Td>
                  <Td>{c.phone ?? "—"}</Td>
                  <Td className="text-right">
                    {due > 0 ? (
                      <Badge tone="amber">{formatMoney(due)}</Badge>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/admin/customers/${c.id}`} className={btnRowCls}>
                        Ledger
                      </Link>
                      <Link href={`/admin/customers/${c.id}/edit`} className={btnRowCls}>
                        Edit
                      </Link>
                      <DeleteButton action={deleteCustomer.bind(null, c.id)} />
                    </div>
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
