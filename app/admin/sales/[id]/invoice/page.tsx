import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, BackLink } from "@/components/ui";
import { InvoicePrintButton } from "@/components/invoice-print-button";
import InvoiceSheet from "@/components/invoice-sheet";
import RecordPaymentForm from "@/components/record-payment-form";
import { recordSalePayment } from "@/lib/actions/sales";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { item: { select: { name: true, baseUnit: true } } } },
    },
  });
  if (!sale) notFound();

  const remaining = sale.totalAmount.minus(sale.paidAmount);
  const isCredit = sale.paymentType === "CREDIT";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackLink href="/admin/sales">Back to sales</BackLink>
        <InvoicePrintButton />
      </div>

      <InvoiceSheet sale={sale} />

      {isCredit && remaining.gt(0) && (
        <Card className="p-5 print:hidden">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Record a payment</h2>
          <RecordPaymentForm action={recordSalePayment.bind(null, id)} remainingLabel={formatMoney(remaining)} />
          {sale.customerId && (
            <Link href={`/admin/customers/${sale.customerId}`} className="mt-3 inline-block text-sm text-brand-700 hover:underline dark:text-brand-400">
              View customer ledger →
            </Link>
          )}
        </Card>
      )}
    </div>
  );
}
