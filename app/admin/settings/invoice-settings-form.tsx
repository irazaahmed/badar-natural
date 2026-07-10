"use client";

import { useActionState } from "react";
import { updateInvoiceSettings } from "@/lib/actions/settings";
import type { FormState } from "@/lib/actions/utils";
import { FormError, FormSuccess, Label, SubmitButton, inputCls } from "@/components/ui";

export default function InvoiceSettingsForm({
  thankYouMessage,
  sharePrefillText,
}: {
  thankYouMessage: string;
  sharePrefillText: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(updateInvoiceSettings, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="thankYouMessage">Invoice thank-you message</Label>
        <textarea
          id="thankYouMessage"
          name="thankYouMessage"
          rows={2}
          defaultValue={thankYouMessage}
          className={inputCls}
          placeholder="Printed at the bottom of every invoice"
        />
      </div>
      <div>
        <Label htmlFor="sharePrefillText">WhatsApp share message</Label>
        <textarea
          id="sharePrefillText"
          name="sharePrefillText"
          rows={2}
          defaultValue={sharePrefillText}
          className={inputCls}
          placeholder="Pre-filled text when sharing an invoice on WhatsApp"
        />
      </div>
      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Invoice settings saved." />}
      <SubmitButton pendingText="Saving…">Save invoice settings</SubmitButton>
    </form>
  );
}
