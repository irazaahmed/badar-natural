import type { Prisma } from "@prisma/client";
import { Card, Badge } from "@/components/ui";
import { Logo } from "@/components/logo";
import { formatMoney, formatDate } from "@/lib/format";
import { formatKg } from "@/lib/units";
import { BUSINESS, INVOICE_NASTALIQ_TAGLINE, DEFAULT_THANK_YOU } from "@/lib/business";

export type InvoiceSale = {
  invoiceNumber: string;
  channel: "RETAIL" | "WHOLESALE";
  createdAt: Date;
  paymentType: "CASH" | "CREDIT";
  status: "UNPAID" | "PARTIAL" | "PAID";
  dueDate: Date | null;
  cancelledAt?: Date | null;
  totalAmount: Prisma.Decimal;
  paidAmount: Prisma.Decimal;
  customer: { name: string; phone: string | null } | null;
  items: {
    id: string;
    item: { name: string; baseUnit: "GRAM" | "ML" };
    quantityLabel: string;
    quantityGrams: Prisma.Decimal;
    ratePerKg: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
  }[];
};

/**
 * The branded, bilingual (English + Urdu) invoice sheet. Read-only and print
 * ready — shared by the admin invoice page and the customer portal so both
 * render an identical bill. Any payment controls live OUTSIDE this component.
 *
 * Line items are boxed (§8.2) and a mandatory Urdu Nastaleeq tagline (§8.1) is
 * printed below the thank-you line. `thankYouMessage` is owner-configurable
 * (§7.1) and falls back to the constant when not supplied.
 */
export default function InvoiceSheet({
  sale,
  thankYouMessage = DEFAULT_THANK_YOU,
}: {
  sale: InvoiceSale;
  thankYouMessage?: string;
}) {
  const remaining = sale.totalAmount.minus(sale.paidAmount);
  const isCredit = sale.paymentType === "CREDIT";
  const overdue = sale.status !== "PAID" && !!sale.dueDate && sale.dueDate < new Date();
  const cancelled = !!sale.cancelledAt;

  // Boxed cell border in the brand's dark-brown tone (§8.2), not pure black.
  const cell = "border border-navy-800/60 px-3 py-2 dark:border-brand-200/25";

  return (
    <Card className="invoice-sheet overflow-hidden p-0 print:border-0 print:shadow-none">
      {/* Header — espresso band with logo + bilingual tagline */}
      <div className="bg-navy-900 px-8 py-6 text-white print:bg-navy-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Logo size={64} priority className="ring-brand-300/50 print:shadow-none" />
            <div>
              <p className="font-display text-2xl font-bold tracking-tight">
                Badar <span className="underline decoration-brand-300 decoration-2 underline-offset-4">Natural</span> Foods
              </p>
              <p className="mt-1 text-sm text-brand-200">{BUSINESS.tagline}</p>
              <p dir="rtl" className="mt-0.5 text-sm text-brand-200/90">{BUSINESS.taglineUrdu}</p>
            </div>
          </div>
          <div className="text-right text-xs text-brand-100/80">
            <p>Owner: {BUSINESS.owner}</p>
            <p>{BUSINESS.phone}</p>
            <p>{BUSINESS.website.replace("https://", "").replace(/\/$/, "")}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 text-slate-800 dark:text-slate-200">
        {cancelled && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
            CANCELLED — منسوخ {sale.cancelledAt ? `(${formatDate(sale.cancelledAt)})` : ""}
          </div>
        )}
        {/* Meta */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Invoice / رسید</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{sale.invoiceNumber}</p>
            <p className="mt-1 text-sm text-slate-500">{formatDate(sale.createdAt)}</p>
            <p className="mt-0.5 text-xs text-slate-400">{sale.channel === "WHOLESALE" ? "Wholesale" : "Retail"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Billed to / گاہک</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{sale.customer?.name ?? "Walk-in"}</p>
            {sale.customer?.phone && <p className="text-sm text-slate-500">{sale.customer.phone}</p>}
          </div>
        </div>

        {/* Lines — boxed cells (§8.2) */}
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100/70 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
              <th className={cell}>Item / تفصیل</th>
              <th className={`${cell} text-right`}>Qty</th>
              <th className={`${cell} text-right`}>Rate/kg</th>
              <th className={`${cell} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((li) => (
              <tr key={li.id}>
                <td className={`${cell} font-medium text-slate-900 dark:text-slate-100`}>{li.item.name}</td>
                <td className={`${cell} text-right tabular-nums`}>
                  {li.quantityLabel}
                  <span className="block text-xs text-slate-400">{formatKg(Number(li.quantityGrams) / 1000, li.item.baseUnit === "ML" ? "ML" : "GRAM")}</span>
                </td>
                <td className={`${cell} text-right tabular-nums`}>{formatMoney(li.ratePerKg)}</td>
                <td className={`${cell} text-right tabular-nums`}>{formatMoney(li.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
            <span>Total / کل</span>
            <span className="tabular-nums">{formatMoney(sale.totalAmount)}</span>
          </div>
          {isCredit && (
            <>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Paid / ادا</span>
                <span className="tabular-nums">{formatMoney(sale.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-amber-600 dark:text-amber-400">
                <span>Outstanding / باقی</span>
                <span className="tabular-nums">{formatMoney(remaining)}</span>
              </div>
            </>
          )}
        </div>

        {/* Payment status */}
        <div className="mt-5 flex items-center gap-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
          <span className="text-slate-500">Payment:</span>
          {cancelled ? (
            <Badge tone="red">Cancelled</Badge>
          ) : !isCredit ? (
            <Badge tone="emerald">Cash — paid in full</Badge>
          ) : sale.status === "PAID" ? (
            <Badge tone="emerald">Credit — cleared</Badge>
          ) : overdue ? (
            <Badge tone="red">Credit — overdue{sale.dueDate ? ` (due ${formatDate(sale.dueDate)})` : ""}</Badge>
          ) : (
            <Badge tone="amber">Credit{sale.dueDate ? ` — due ${formatDate(sale.dueDate)}` : ""}</Badge>
          )}
        </div>

        {/* Thank-you (configurable, §7.1) */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">{thankYouMessage}</p>
        <p className="mt-0.5 text-center text-xs text-slate-400">شکریہ · Shukriya — {BUSINESS.name}</p>

        {/* Mandatory Urdu Nastaleeq tagline (§8.1) — RTL, secondary size. */}
        <p
          dir="rtl"
          lang="ur"
          className="font-nastaliq mx-auto mt-4 max-w-xl text-center text-[13px] leading-[2.4] text-navy-900 dark:text-brand-100"
        >
          {INVOICE_NASTALIQ_TAGLINE}
        </p>

        {/* Footer / branding strip */}
        <div className="mt-4 border-t border-slate-200 pt-3 text-center text-[11px] text-slate-400 dark:border-slate-700">
          {BUSINESS.name} · {BUSINESS.owner} · {BUSINESS.phone} · {BUSINESS.website.replace("https://", "").replace(/\/$/, "")}
        </div>
      </div>
    </Card>
  );
}
