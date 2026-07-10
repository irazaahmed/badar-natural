import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLockup } from "@/components/logo";
import PortalNav from "./portal-nav";

export const metadata: Metadata = {
  title: "My Account — Badar Natural Foods",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth (proxy.ts already gates /portal/*).
  const session = await auth();
  if (session?.user?.role !== "CUSTOMER") redirect("/login");
  const name = session.user.name ?? "Customer";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="bg-navy-900 text-white print:hidden">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BrandLockup onDark size={40} textClassName="text-lg" priority />
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-brand-100/80 sm:inline">
                Assalam-o-Alaikum, <span className="font-semibold text-white">{name}</span>
              </span>
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
          <div className="mt-4">
            <PortalNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 print:p-0">{children}</main>
    </div>
  );
}
