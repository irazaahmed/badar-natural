"use client";

import { useRef } from "react";

/**
 * Shared barcode-scan field (§8.3). USB/Bluetooth scanners act as HID keyboards
 * — they type the code fast and finish with Enter. This is just a text input
 * that fires `onScan` on Enter, then clears itself and keeps focus so the owner
 * can scan the next item back-to-back without touching the mouse.
 *
 * Deliberately NOT inside the parent <form>'s submit path: Enter here is caught
 * and never bubbles to submit the sale/purchase.
 */
export function BarcodeInput({
  onScan,
  placeholder = "Scan barcode…",
  autoFocus = false,
  className = "",
}: {
  onScan: (code: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault(); // never submit the surrounding form
    const code = e.currentTarget.value.trim();
    if (code) onScan(code);
    e.currentTarget.value = "";
    // stay focused for the next scan
    requestAnimationFrame(() => ref.current?.focus());
  }

  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5v14M7 5v14M11 5v14M14 5v14M18 5v14M21 5v14" />
        </svg>
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="none"
        autoComplete="off"
        autoFocus={autoFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Barcode scan"
        className="w-full rounded-xl border border-brand-300 bg-brand-50/60 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:bg-slate-800"
      />
    </div>
  );
}
