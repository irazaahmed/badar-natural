import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { PageHeader, Card, BackLink } from "@/components/ui";
import ItemForm, { type ItemFormValues } from "@/components/item-form";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) notFound();

  const initial: ItemFormValues = {
    id: item.id,
    name: item.name,
    category: item.category,
    baseUnit: item.baseUnit === "ML" ? "ML" : "GRAM",
    retailPricePerKg: item.retailPricePerKg.toString(),
    wholesalePricePerKg: item.wholesalePricePerKg.toString(),
    bagWeightKg: item.bagWeightKg ? item.bagWeightKg.toString() : "",
    lowStockThresholdKg: (Number(item.lowStockThreshold) / 1000).toString(),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/items">Back to Stock</BackLink>
      <PageHeader title={`Edit ${item.name}`} description="Update prices, category and alert threshold." />
      <Card className="p-6">
        <ItemForm initial={initial} />
      </Card>
    </div>
  );
}
