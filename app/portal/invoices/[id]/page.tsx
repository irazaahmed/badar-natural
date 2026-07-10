import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { BackLink } from "@/components/ui";
import { InvoicePrintButton } from "@/components/invoice-print-button";
import InvoiceSheet from "@/components/invoice-sheet";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PortalInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!customerId) redirect("/login");

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
  // Not found OR not this customer's invoice — never leak another customer's bill.
  if (!sale || sale.customerId !== customerId) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackLink href="/portal/invoices">Back to invoices</BackLink>
        <InvoicePrintButton />
      </div>
      <InvoiceSheet sale={sale} thankYouMessage={settings.thankYouMessage} />
    </div>
  );
}
