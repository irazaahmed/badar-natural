import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

/** RFC-4180-ish CSV cell: quote and double any embedded quotes. */
function cell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function earliestDue(docs: { dueDate: Date | null }[], now: Date) {
  const dues = docs.map((d) => d.dueDate).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime());
  const oldest = dues[0] ?? null;
  return { oldest, overdue: !!oldest && oldest < now };
}

/** Consolidated credit report as CSV (§7.3), overdue-first. Admin only. */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const [suppliers, customers] = await Promise.all([
    prisma.supplier.findMany({
      where: { totalPayable: { gt: 0 } },
      include: { purchases: { where: { status: { not: "PAID" } }, select: { dueDate: true } } },
    }),
    prisma.customer.findMany({
      where: { totalReceivable: { gt: 0 } },
      include: { sales: { where: { status: { not: "PAID" }, paymentType: "CREDIT", cancelledAt: null }, select: { dueDate: true } } },
    }),
  ]);

  const rows: (string | number)[][] = [["Type", "Name", "Phone", "Oldest due", "Overdue", "Amount"]];

  const payables = suppliers
    .map((s) => ({ name: s.name, phone: s.phone ?? "", amount: Number(s.totalPayable), ...earliestDue(s.purchases, now) }))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.oldest?.getTime() ?? Infinity) - (b.oldest?.getTime() ?? Infinity));
  for (const p of payables) {
    rows.push(["Payable", p.name, p.phone, p.oldest ? formatDate(p.oldest) : "", p.overdue ? "Yes" : "No", p.amount.toFixed(2)]);
  }

  const receivables = customers
    .map((c) => ({ name: c.name, phone: c.phone ?? "", amount: Number(c.totalReceivable), ...earliestDue(c.sales, now) }))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.oldest?.getTime() ?? Infinity) - (b.oldest?.getTime() ?? Infinity));
  for (const r of receivables) {
    rows.push(["Receivable", r.name, r.phone, r.oldest ? formatDate(r.oldest) : "", r.overdue ? "Yes" : "No", r.amount.toFixed(2)]);
  }

  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="credit-report-${stamp}.csv"`,
    },
  });
}
