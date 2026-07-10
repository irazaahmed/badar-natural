"use client";

import { useState } from "react";
import { Input, Label, inputCls } from "@/components/ui";

export type PickerSupplier = { id: string; name: string; phone: string | null };

/**
 * Supplier picker for the purchase form. "Existing" selects a saved supplier
 * (submits `supplierId`); "New" types a name + phone (submits `supplierName` +
 * `supplierPhone`, which the server creates). A purchase must have a supplier.
 */
export default function SupplierPicker({ suppliers }: { suppliers: PickerSupplier[] }) {
  const [mode, setMode] = useState<"existing" | "new">(
    suppliers.length > 0 ? "existing" : "new",
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Supplier</Label>
        <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-600">
          {(["existing", "new"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                mode === m
                  ? "bg-brand-300 text-navy-900"
                  : "text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-400"
              }`}
            >
              {m === "existing" ? "Existing" : "+ New supplier"}
            </button>
          ))}
        </div>
      </div>

      {mode === "existing" ? (
        <select name="supplierId" className={inputCls} defaultValue="">
          <option value="" disabled>
            — Select a supplier —
          </option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.phone ? ` · ${s.phone}` : ""}
            </option>
          ))}
        </select>
      ) : (
        <div className="grid gap-3 rounded-xl border border-dashed border-slate-300 p-3 sm:grid-cols-2 dark:border-slate-700">
          <div>
            <Label htmlFor="supplierName">Supplier name</Label>
            <Input id="supplierName" name="supplierName" placeholder="Wholesaler name" />
          </div>
          <div>
            <Label htmlFor="supplierPhone">Phone (optional)</Label>
            <Input id="supplierPhone" name="supplierPhone" placeholder="03xx-xxxxxxx" />
          </div>
        </div>
      )}
    </div>
  );
}
