"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton } from "@/components/ui";

export default function SupplierForm({
  action,
  defaults = {},
  submitLabel = "Save supplier",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: { name?: string; phone?: string; address?: string };
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Supplier name</Label>
        <Input id="name" name="name" required defaultValue={defaults.name} placeholder="Wholesaler / company name" />
      </div>
      <div>
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" defaultValue={defaults.phone} placeholder="03xx-xxxxxxx" />
      </div>
      <div>
        <Label htmlFor="address">Address (optional)</Label>
        <Input id="address" name="address" defaultValue={defaults.address} placeholder="Mandi / market" />
      </div>
      <FormError message={state?.error} />
      <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
    </form>
  );
}
