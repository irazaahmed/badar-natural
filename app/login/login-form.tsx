"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";
import { PasswordInput } from "@/components/password-input";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Email or phone
        </label>
        <input
          id="email"
          name="email"
          type="text"
          autoComplete="username"
          required
          placeholder="you@example.com or 03xx-xxxxxxx"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Password
        </label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="••••••••" />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4.5M12 15.5v.5" />
          </svg>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {isPending && (
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        )}
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
