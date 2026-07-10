import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Card, EmptyState, LinkButton } from "@/components/ui";
import RetailForm from "./retail-form";

export const dynamic = "force-dynamic";

export default async function RetailSalePage() {
  const [items, customers] = await Promise.all([
    prisma.item.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <BackLink href="/admin">Back to dashboard</BackLink>
        <EmptyState title="Add items first" hint="You need active items before selling." action={<LinkButton href="/admin/items/new">+ New item</LinkButton>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/admin">Back to dashboard</BackLink>
      <PageHeader title="Retail sale" description="Fast counter entry — pick an item, tap a quantity, complete." />
      <Card className="p-6">
        <RetailForm
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            baseUnit: i.baseUnit === "ML" ? "ML" : "GRAM",
            currentStock: Number(i.currentStock),
            retailPricePerKg: i.retailPricePerKg.toString(),
            barcode: i.barcode,
            defaultPackWeightGrams: i.defaultPackWeightGrams,
          }))}
          customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone ?? "" }))}
        />
      </Card>
    </div>
  );
}
