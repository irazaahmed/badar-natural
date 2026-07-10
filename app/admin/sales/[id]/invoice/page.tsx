import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, BackLink, Badge } from "@/components/ui";
import { InvoicePrintButton } from "@/components/invoice-print-button";
import { InvoiceShareBar } from "@/components/invoice-share-bar";
import { CancelSaleForm } from "@/components/cancel-sale-form";
import InvoiceSheet from "@/components/invoice-sheet";
import RecordPaymentForm from "@/components/record-payment-form";
import { recordSalePayment } from "@/lib/actions/sales";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sale, settings] = await Promise.all([
    prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { item: { select: { name: true, baseUnit: true } } } },
      },
    }),
    getSettings(),
  ]);
  if (!sale) notFound();

  const remaining = sale.totalAmount.minus(sale.paidAmount);
  const isCredit = sale.paymentType === "CREDIT";
  const cancelled = !!sale.cancelledAt;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackLink href="/admin/sales">Back to sales</BackLink>
        <div className="flex flex-wrap items-center gap-3">
          <InvoicePrintButton />
          <InvoiceShareBar
            invoiceNumber={sale.invoiceNumber}
            phone={sale.customer?.phone ?? null}
            shareText={settings.sharePrefillText}
          />
        </div>
      </div>

      <InvoiceSheet sale={sale} thankYouMessage={settings.thankYouMessage} />

      {isCredit && remaining.gt(0) && !cancelled && (
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

      {/* Cancel / refund (§7.1) */}
      <Card className="p-5 print:hidden">
        {cancelled ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge tone="red">Cancelled</Badge>
            <span className="text-slate-500 dark:text-slate-400">
              {sale.cancelledAt ? formatDate(sale.cancelledAt) : ""}
              {sale.cancelReason ? ` — ${sale.cancelReason}` : ""}. Stock and any receivable were reversed.
            </span>
          </div>
        ) : (
          <CancelSaleForm saleId={sale.id} />
        )}
      </Card>
    </div>
  );
}
