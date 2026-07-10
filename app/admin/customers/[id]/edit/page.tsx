import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Card } from "@/components/ui";
import { updateCustomer } from "@/lib/actions/customers";
import CustomerForm from "../../customer-form";

export const metadata = { title: "Edit customer — Badar Natural Foods" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/customers">Back to customers</BackLink>
      <PageHeader title="Edit customer" />
      <Card className="p-6">
        <CustomerForm
          action={updateCustomer.bind(null, id)}
          defaults={{
            name: customer.name,
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            type: customer.type,
            hasLogin: customer.passwordHash !== null,
          }}
          submitLabel="Save changes"
        />
      </Card>
    </div>
  );
}
