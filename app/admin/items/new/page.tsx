import { PageHeader, Card, BackLink } from "@/components/ui";
import ItemForm from "@/components/item-form";

export default function NewItemPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/items">Back to Stock</BackLink>
      <PageHeader title="New item" description="Add a kiryana item to the shared inventory." />
      <Card className="p-6">
        <ItemForm />
      </Card>
    </div>
  );
}
