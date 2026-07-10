"use client";

/**
 * Small shared UI primitives for the Badar Natural Foods portal so every
 * module (stock, purchases, retail & wholesale sales, suppliers, customers,
 * ledgers) looks consistent without pulling in a component library.
 *
 * Brand language (matches the public site / login):
 *   - brand-600 primary accent for CTAs
 *   - rounded-xl inputs/buttons, rounded-2xl cards
 *   - slate neutrals; red/amber/emerald reserved for semantics
 */

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

/* ------------------------------ class tokens ----------------------------- */

export const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none disabled:hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500 dark:disabled:hover:border-slate-700";

// Signature Badar CTA — mustard-gold pill, espresso text, fully rounded.
export const btnPrimaryCls =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand-300 px-5 py-2.5 text-sm font-semibold text-navy-900 shadow-md shadow-brand-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-200 hover:shadow-lg hover:shadow-brand-600/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md";

export const btnSecondaryCls =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-400";

/** Compact secondary button for table row actions (Edit / View / Manage). */
export const btnRowCls =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-400";

/* -------------------------------- elements ------------------------------- */

export function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null);

  // Hard-stop the mouse wheel from silently changing number amounts — only
  // typing should. React's onWheel is registered as a *passive* listener, so
  // preventDefault() there is ignored; we attach a native NON-passive listener
  // and preventDefault only while this number field is focused (page scroll is
  // otherwise unaffected).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.type === "number" && document.activeElement === el) {
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <input
      ref={ref}
      {...props}
      className={`${inputCls} ${props.className ?? ""}`}
    />
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

/** Submit button with automatic pending state (must live inside a <form>). */
export function SubmitButton({
  children,
  pendingText = "Saving…",
}: {
  children: React.ReactNode;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnPrimaryCls}>
      {pending && <Spinner />}
      {pending ? pendingText : children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={variant === "primary" ? btnPrimaryCls : btnSecondaryCls}
    >
      {children}
    </Link>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
    >
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4.5M12 15.5v.5" />
      </svg>
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </svg>
      {message}
    </p>
  );
}

/** Consistent "← Back to …" link used above page headers. */
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
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
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      {children}
    </Link>
  );
}

/* --------------------------------- layout -------------------------------- */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}

/* --------------------------------- tables -------------------------------- */

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">{children}</table>
    </Card>
  );
}

export function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:rounded-tl-2xl last:rounded-tr-2xl dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border-b border-slate-100 px-4 py-3 align-middle text-slate-700 dark:border-slate-800 dark:text-slate-300 ${className}`}
    >
      {children}
    </td>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "brand" | "amber" | "red" | "emerald";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20",
    brand: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-400/10 dark:text-brand-400 dark:ring-brand-400/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------- skeletons ------------------------------- */

/** Base pulsing block — compose into shapes that mirror the real content. */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/50 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/** Table skeleton matching <Table>/<Th>/<Td> row shape. First column reads wider (name/title-like). */
export function TableSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <Card className="overflow-hidden" aria-hidden="true">
      <div className="flex gap-8 border-b border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/60">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-8 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 ${c === 0 ? "w-32" : "w-14"}`} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Summary-card skeleton (dashboard / portal ledger stat cards). */
export function StatCardSkeleton() {
  return (
    <Card className="px-5 py-4" aria-hidden="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2.5 h-7 w-32" />
      <Skeleton className="mt-2 h-3 w-28" />
    </Card>
  );
}

/** Chart-card skeleton for the dashboard's recharts panels. */
export function ChartCardSkeleton({ height = 240 }: { height?: number }) {
  return (
    <Card className="p-5" aria-hidden="true">
      <Skeleton className="h-3.5 w-48" />
      <Skeleton className="mt-2 h-3 w-64" />
      <Skeleton className="mt-4 w-full rounded-xl" style={{ height }} />
    </Card>
  );
}

/** Entry-detail skeleton (purchase/sale/invoice detail pages). */
export function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Card className="p-5">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-3 w-24" />
            <Skeleton className="ml-auto h-6 w-32" />
          </div>
        </div>
      </Card>
      <TableSkeleton rows={4} cols={4} />
      <TableSkeleton rows={2} cols={3} />
    </div>
  );
}

/* ------------------------------ empty states ----------------------------- */

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/20">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 13.5V19a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 19v-5.5M3 13.5 5.4 5A1.5 1.5 0 0 1 6.84 4h10.32a1.5 1.5 0 0 1 1.44 1L21 13.5M3 13.5h5.25a3.75 3.75 0 0 0 7.5 0H21" />
        </svg>
      </span>
      <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      {hint && <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
