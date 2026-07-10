import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Card, EmptyState, LinkButton } from "@/components/ui";
import PurchaseForm from "../purchase-form";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const [items, suppliers] = await Promise.all([
    prisma.item.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <BackLink href="/admin/purchases">Back to purchases</BackLink>
        <EmptyState
          title="Add items first"
          hint="You need at least one active item before recording a purchase."
          action={<LinkButton href="/admin/items/new">+ New item</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/admin/purchases">Back to purchases</BackLink>
      <PageHeader title="New purchase" description="Buy bulk stock from a supplier. Stock increases on save." />
      <Card className="p-6">
        <PurchaseForm
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            bagWeightKg: i.bagWeightKg ? i.bagWeightKg.toString() : null,
            lastPurchasePricePerKg: i.lastPurchasePricePerKg ? i.lastPurchasePricePerKg.toString() : null,
            barcode: i.barcode,
          }))}
          suppliers={suppliers.map((s) => ({ id: s.id, name: s.name, phone: s.phone }))}
        />
      </Card>
    </div>
  );
}
