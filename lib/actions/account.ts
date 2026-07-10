"use server";

import { auth } from "@/auth";
import { changeAdminPassword } from "@/lib/admin-auth";
import { requireAdmin, field, type FormState } from "./utils";

/**
 * Change the signed-in admin's password (settings screen). Verifies the
 * current password, enforces a minimum length and a confirmation match, then
 * stores a fresh bcrypt hash in the AdminUser table.
 */
export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: "Not signed in." };

  const current = field(formData, "currentPassword");
  const next = field(formData, "newPassword");
  const confirm = field(formData, "confirmPassword");

  if (!current) return { error: "Enter your current password." };
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };
  if (next === current) return { error: "New password must be different from the current one." };

  const error = await changeAdminPassword(email, current, next);
  if (error) return { error };

  return { ok: true };
}
