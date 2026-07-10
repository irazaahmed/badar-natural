"use client";

import { useState } from "react";
import { Input, Label, inputCls } from "@/components/ui";

export type PickerCustomer = { id: string; name: string; phone: string };

/**
 * Shared optional-customer picker for the sale / wallet / mobile-sell forms.
 * Two explicit modes via a toggle:
 *   - "Existing" — pick a saved customer (submits `customerId`)
 *   - "New"      — type name + phone (submits `customerName` + `customerPhone`,
 *                  which the server upserts by phone into the Customers list)
 * Leaving Existing on "Walk-in" with nothing typed means no customer (cash).
 */
export default function CustomerPicker({
  customers,
  label = "Customer (optional)",
}: {
  customers: PickerCustomer[];
  label?: string;
}) {
  // Default to "new" when there are no saved customers yet.
  const [mode, setMode] = useState<"existing" | "new">(
    customers.length > 0 ? "existing" : "new",
  );
  const [existingId, setExistingId] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-600">
          {(["existing", "new"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                mode === m
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-400"
              }`}
            >
              {m === "existing" ? "Existing" : "+ New customer"}
            </button>
          ))}
        </div>
      </div>

      {mode === "existing" ? (
        <select
          id="customerId"
          name="customerId"
          value={existingId}
          onChange={(e) => setExistingId(e.target.value)}
          className={inputCls}
        >
          <option value="">— Walk-in (no customer) —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.phone}
            </option>
          ))}
        </select>
      ) : (
        <div className="grid gap-3 rounded-xl border border-dashed border-slate-300 p-3 sm:grid-cols-2 dark:border-slate-700">
          <div>
            <Label htmlFor="customerName">Customer name</Label>
            <Input id="customerName" name="customerName" placeholder="e.g. Ahmed" />
          </div>
          <div>
            <Label htmlFor="customerPhone">Phone</Label>
            <Input id="customerPhone" name="customerPhone" placeholder="03xx-xxxxxxx" />
          </div>
          <p className="text-xs text-slate-500 sm:col-span-2 dark:text-slate-400">
            Saved to your Customers list automatically (matched by phone).
          </p>
        </div>
      )}
    </div>
  );
}
