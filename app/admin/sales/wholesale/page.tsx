import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Card, EmptyState, LinkButton } from "@/components/ui";
import WholesaleForm from "./wholesale-form";

export const dynamic = "force-dynamic";

export default async function WholesaleSalePage() {
  const [items, customers] = await Promise.all([
    prisma.item.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, include: { itemRates: true } }),
  ]);

  // Per-customer pricing map (§7.2) for the form to apply live.
  const customerTerms: Record<string, { discountPercent: number | null; rates: Record<string, string> }> = {};
  for (const c of customers) {
    customerTerms[c.id] = {
      discountPercent: c.discountPercent ? Number(c.discountPercent) : null,
      rates: Object.fromEntries(c.itemRates.map((r) => [r.itemId, r.ratePerKg.toString()])),
    };
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <BackLink href="/admin">Back to dashboard</BackLink>
        <EmptyState title="Add items first" hint="You need active items before selling." action={<LinkButton href="/admin/items/new">+ New item</LinkButton>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/admin">Back to dashboard</BackLink>
      <PageHeader title="Wholesale sale" description="Sell bulk quantities at wholesale rates. Stock decreases on save." />
      <Card className="p-6">
        <WholesaleForm
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            baseUnit: i.baseUnit === "ML" ? "ML" : "GRAM",
            currentStock: Number(i.currentStock),
            wholesalePricePerKg: i.wholesalePricePerKg.toString(),
            bagWeightKg: i.bagWeightKg ? i.bagWeightKg.toString() : null,
            barcode: i.barcode,
          }))}
          customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone ?? "" }))}
          customerTerms={customerTerms}
        />
      </Card>
    </div>
  );
}
