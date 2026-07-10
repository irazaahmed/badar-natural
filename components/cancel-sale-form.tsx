"use client";

import { useState } from "react";
import { cancelSale } from "@/lib/actions/sales";
import { Input, Label } from "@/components/ui";

/**
 * Cancel / refund control for a sale (§7.1). Full-sale cancel only (the client-
 * recommended default): reverses stock and refunds any outstanding receivable.
 * Two-step — the owner must open the panel and confirm — so an invoice is never
 * voided by a stray click. The Sale is soft-cancelled, never deleted.
 */
export function CancelSaleForm({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline dark:text-red-400"
      >
        Cancel / refund this sale
      </button>
    );
  }

  return (
    <form action={cancelSale.bind(null, saleId)} className="space-y-3">
      <div>
        <Label htmlFor="cancelReason">Reason (optional)</Label>
        <Input id="cancelReason" name="cancelReason" placeholder="e.g. wrong item, customer returned goods" />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        This reverses stock and refunds any outstanding balance for this invoice. The record is kept
        (marked cancelled), not deleted.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Confirm cancel
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300"
        >
          Keep sale
        </button>
      </div>
    </form>
  );
}
