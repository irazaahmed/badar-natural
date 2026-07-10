import { auth } from "@/auth";
import { Card, PageHeader } from "@/components/ui";
import ChangePasswordForm from "./change-password-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Badar Natural Foods" };

export default async function SettingsPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Settings" description="Manage your admin account." />

      <Card className="mb-6 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Signed in as
        </p>
        <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{email}</p>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Change password</h2>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
