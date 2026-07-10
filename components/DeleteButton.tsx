"use client";

import { useState, useTransition } from "react";

type DeleteResult = { error?: string } | undefined;

/**
 * Delete button for list rows / detail pages. Takes a *bound* server action
 * (e.g. `deleteSupplier.bind(null, supplier.id)`) that resolves to
 * `{ error }` when deletion is blocked (FK protection) — the error is shown
 * inline instead of crashing with a Prisma FK violation.
 */
export default function DeleteButton({
  action,
  confirmMessage = "Delete this item? This cannot be undone.",
  label = "Delete",
}: {
  action: () => Promise<DeleteResult>;
  confirmMessage?: string;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          if (!window.confirm(confirmMessage)) return;
          startTransition(async () => {
            const result = await action();
            if (result?.error) setError(result.error);
          });
        }}
        className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-slate-800 dark:text-red-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/10"
      >
        {pending ? "Deleting…" : label}
      </button>
      {error && (
        <p role="alert" className="max-w-60 text-right text-xs leading-snug text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
