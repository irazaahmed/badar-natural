import { logout } from "@/lib/actions/auth";

/**
 * Server-component sign-out button. Drop into any page/layout:
 *   import SignOutButton from "@/components/SignOutButton";
 */
export default function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
        </svg>
        Sign out
      </button>
    </form>
  );
}
