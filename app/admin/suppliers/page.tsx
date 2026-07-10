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
import { deleteSupplier } from "@/lib/actions/suppliers";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const now = new Date();
  const [suppliers, overdue] = await Promise.all([
    prisma.supplier.findMany({ orderBy: [{ totalPayable: "desc" }, { name: "asc" }] }),
    prisma.purchase.groupBy({
      by: ["supplierId"],
      where: { status: { not: "PAID" }, dueDate: { lt: now } },
      _count: { _all: true },
    }),
  ]);

  const overdueSet = new Set(overdue.map((o) => o.supplierId));
  const totalPayable = suppliers.reduce((s, x) => s + Number(x.totalPayable), 0);

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Wholesalers you buy stock from. Outstanding = payable you owe them."
        action={<LinkButton href="/admin/suppliers/new">+ Add supplier</LinkButton>}
      />

      <div className="mb-5 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-brand-50 px-4 py-1.5 font-medium text-brand-800 ring-1 ring-inset ring-brand-200 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20">
          Total payable: {formatMoney(totalPayable)}
        </span>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers yet"
          hint="Add a wholesaler, or one is created automatically when you record a purchase."
          action={<LinkButton href="/admin/suppliers/new">+ Add supplier</LinkButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th className="text-right">Payable</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => {
              const due = Number(s.totalPayable);
              return (
                <tr key={s.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">
                    <Link href={`/admin/suppliers/${s.id}`} className="hover:text-brand-700 hover:underline dark:hover:text-brand-400">
                      {s.name}
                    </Link>
                    {overdueSet.has(s.id) && <span className="ml-2"><Badge tone="red">Overdue</Badge></span>}
                  </Td>
                  <Td>{s.phone ?? "—"}</Td>
                  <Td className="text-right">
                    {due > 0 ? (
                      <Badge tone="amber">{formatMoney(due)}</Badge>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/admin/suppliers/${s.id}`} className={btnRowCls}>
                        Ledger
                      </Link>
                      <Link href={`/admin/suppliers/${s.id}/edit`} className={btnRowCls}>
                        Edit
                      </Link>
                      <DeleteButton action={deleteSupplier.bind(null, s.id)} />
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
