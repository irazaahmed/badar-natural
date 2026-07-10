"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton, inputCls } from "@/components/ui";

export default function CustomerForm({
  action,
  defaults = {},
  submitLabel = "Save customer",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: {
    name?: string;
    phone?: string;
    address?: string;
    type?: string;
    hasLogin?: boolean;
    discountPercent?: string;
    creditLimit?: string;
  };
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const hasLogin = defaults.hasLogin ?? false;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={defaults.name} placeholder="Customer / shop name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" defaultValue={defaults.phone} placeholder="03xx-xxxxxxx" />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" defaultValue={defaults.type ?? "WHOLESALE"} className={inputCls}>
            <option value="WHOLESALE">Wholesale buyer</option>
            <option value="RETAIL_REGULAR">Retail regular</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="address">Address (optional)</Label>
        <Input id="address" name="address" defaultValue={defaults.address} placeholder="Shop / area" />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Phone is unique when given — re-adding the same number updates the existing customer.
      </p>

      {/* Wholesale terms (§7.2) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="discountPercent">Standing discount (%, optional)</Label>
          <Input id="discountPercent" name="discountPercent" type="number" min="0" max="100" step="0.1" defaultValue={defaults.discountPercent} placeholder="e.g. 5" />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Applied to wholesale lines when no per-item rate is set.</p>
        </div>
        <div>
          <Label htmlFor="creditLimit">Credit limit (Rs., optional)</Label>
          <Input id="creditLimit" name="creditLimit" type="number" min="0" step="1" defaultValue={defaults.creditLimit} placeholder="blank = unlimited" />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Credit sales past this warn the owner (override allowed).</p>
        </div>
      </div>

      {/* Portal login (optional, owner-provisioned) */}
      <div className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="portalPassword">Portal login (optional)</Label>
          {hasLogin && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              Enabled
            </span>
          )}
        </div>
        <Input
          id="portalPassword"
          name="portalPassword"
          type="password"
          autoComplete="new-password"
          placeholder={hasLogin ? "Set a new password to reset" : "Set a password to enable login"}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The customer signs in at the login page using their <strong>phone number</strong> and this
          password to view their own ledger &amp; invoices (read-only).
          {hasLogin ? " Leave blank to keep the current password." : " A phone number is required."}
        </p>
        {hasLogin && (
          <label className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <input type="checkbox" name="removePortalAccess" className="h-4 w-4 rounded border-slate-300" />
            Remove portal access
          </label>
        )}
      </div>

      <FormError message={state?.error} />
      <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
    </form>
  );
}
