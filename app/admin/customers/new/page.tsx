import { BackLink, PageHeader, Card } from "@/components/ui";
import { saveCustomer } from "@/lib/actions/customers";
import CustomerForm from "../customer-form";

export const metadata = { title: "Add customer — Badar Natural Foods" };

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/customers">Back to customers</BackLink>
      <PageHeader title="Add customer" />
      <Card className="p-6">
        <CustomerForm action={saveCustomer} />
      </Card>
    </div>
  );
}
