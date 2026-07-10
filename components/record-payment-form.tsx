"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/utils";
import {
  FormError,
  FormSuccess,
  Input,
  Label,
  SubmitButton,
} from "@/components/ui";

/**
 * "Record payment" form on purchase/sale detail pages. `action` is a bound
 * server action (recordPurchasePayment.bind(null, id) or the sale variant).
 * The server validates 0 < amount <= remaining inside the transaction; on
 * success React resets the uncontrolled field and the page data revalidates.
 */
export default function RecordPaymentForm({
  action,
  remainingLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  remainingLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="amount">Payment amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder={`Up to ${remainingLabel}`}
        />
      </div>
      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Payment recorded." />}
      <SubmitButton pendingText="Recording…">Record payment</SubmitButton>
    </form>
  );
}
