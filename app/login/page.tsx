import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLockup } from "@/components/logo";
import { BUSINESS } from "@/lib/business";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login | Badar Natural Foods",
};

const FEATURES = [
  "Fast retail entry — pao / adha kilo / kilo in one tap",
  "Wholesale purchases & sales with supplier / customer ledgers",
  "Credit (udhaar) tracking with overdue flags and reminders",
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative isolate hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14 xl:px-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(232 212 138 / 0.8) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true" />

        <Link href="/" className="relative z-10 w-fit">
          <BrandLockup onDark size={52} textClassName="text-2xl" priority />
        </Link>

        <div className="relative z-10 max-w-md animate-fade-in-up">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            One stock, two counters.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-100/80">
            Retail and wholesale run off the same inventory — every kilo and every
            rupee of udhaar tracked in one place.
          </p>
          <ul className="mt-8 space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-brand-100/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-300/20 text-brand-300 ring-1 ring-brand-300/30">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-brand-200/40">Admin access only · {BUSINESS.phone}</p>
      </div>

      {/* Right — login form */}
      <div className="relative flex flex-col items-center justify-center bg-white px-4 py-12 dark:bg-slate-950 sm:px-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <Link href="/" className="mb-8 flex flex-col items-center gap-3 lg:hidden">
          <BrandLockup size={56} textClassName="text-2xl" priority className="flex-col gap-3" />
        </Link>

        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Sign in to the business portal</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
