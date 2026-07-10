import { PageHeader, Card, BackLink } from "@/components/ui";
import ItemForm, { type ItemFormValues } from "@/components/item-form";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string }>;
}) {
  // A scan that matched no existing item drops the owner here with the barcode
  // pre-filled (§8.3).
  const { barcode } = await searchParams;
  const initial: ItemFormValues | undefined = barcode
    ? {
        name: "",
        category: "",
        baseUnit: "GRAM",
        retailPricePerKg: "",
        wholesalePricePerKg: "",
        bagWeightKg: "",
        lowStockThresholdKg: "",
        barcode,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/items">Back to Stock</BackLink>
      <PageHeader title="New item" description="Add a kiryana item to the shared inventory." />
      <Card className="p-6">
        <ItemForm initial={initial} />
      </Card>
    </div>
  );
}
