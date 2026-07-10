import { auth } from "@/auth";
import { Card, PageHeader } from "@/components/ui";
import ChangePasswordForm from "./change-password-form";
import InvoiceSettingsForm from "./invoice-settings-form";
import { getSettings } from "@/lib/settings";
import { INVOICE_NASTALIQ_TAGLINE } from "@/lib/business";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Badar Natural Foods" };

export default async function SettingsPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Settings" description="Manage your admin account." />

      <Card className="mb-6 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Signed in as
        </p>
        <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{email}</p>
      </Card>

      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Change password</h2>
        <ChangePasswordForm />
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Invoice text</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Shown on printed invoices and when sharing on WhatsApp.
        </p>
        <InvoiceSettingsForm thankYouMessage={settings.thankYouMessage} sharePrefillText={settings.sharePrefillText} />
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Fixed Urdu tagline (always printed)
          </p>
          <p dir="rtl" lang="ur" className="font-nastaliq mt-2 text-[15px] leading-[2.4] text-navy-900 dark:text-brand-100">
            {INVOICE_NASTALIQ_TAGLINE}
          </p>
        </div>
      </Card>
    </div>
  );
}
