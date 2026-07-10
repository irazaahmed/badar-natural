"use client";

import { useActionState } from "react";
import { changePassword } from "@/lib/actions/account";
import type { FormState } from "@/lib/actions/utils";
import { FormError, FormSuccess, Label, SubmitButton } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";

export default function ChangePasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(changePassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" required />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">At least 8 characters.</p>
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
      </div>

      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Password updated. Use it next time you sign in." />}
      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
