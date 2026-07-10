import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader, Card } from "@/components/ui";
import { updateSupplier } from "@/lib/actions/suppliers";
import SupplierForm from "../../supplier-form";

export const metadata = { title: "Edit supplier — Badar Natural Foods" };

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/suppliers">Back to suppliers</BackLink>
      <PageHeader title="Edit supplier" />
      <Card className="p-6">
        <SupplierForm
          action={updateSupplier.bind(null, id)}
          defaults={{ name: supplier.name, phone: supplier.phone ?? "", address: supplier.address ?? "" }}
          submitLabel="Save changes"
        />
      </Card>
    </div>
  );
}
