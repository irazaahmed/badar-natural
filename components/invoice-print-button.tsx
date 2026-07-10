"use client";

import { btnPrimaryCls } from "@/components/ui";

/** Triggers the browser print dialog; hidden from the printed output itself. */
export function InvoicePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`${btnPrimaryCls} print:hidden`}
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
        <path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2M6 14h12v7H6z" />
      </svg>
      Print / Save as PDF
    </button>
  );
}
