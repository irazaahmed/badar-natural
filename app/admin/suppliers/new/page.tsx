import { BackLink, PageHeader, Card } from "@/components/ui";
import { saveSupplier } from "@/lib/actions/suppliers";
import SupplierForm from "../supplier-form";

export const metadata = { title: "Add supplier — Badar Natural Foods" };

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/suppliers">Back to suppliers</BackLink>
      <PageHeader title="Add supplier" />
      <Card className="p-6">
        <SupplierForm action={saveSupplier} />
      </Card>
    </div>
  );
}
