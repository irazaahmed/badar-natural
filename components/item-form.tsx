"use client";

import { useActionState } from "react";
import { createItem, updateItem } from "@/lib/actions/items";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton, inputCls } from "@/components/ui";
import { ITEM_CATEGORIES } from "@/lib/business";

export type ItemFormValues = {
  id?: string;
  name: string;
  category: string;
  baseUnit: "GRAM" | "ML";
  retailPricePerKg: string;
  wholesalePricePerKg: string;
  bagWeightKg: string;
  lowStockThresholdKg: string;
};

export default function ItemForm({ initial }: { initial?: ItemFormValues }) {
  const editing = !!initial?.id;
  const action = editing ? updateItem.bind(null, initial!.id!) : createItem;
  const [state, formAction] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Item name</Label>
          <Input id="name" name="name" required defaultValue={initial?.name} placeholder="e.g. Chakki Atta" />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <input
            id="category"
            name="category"
            list="categories"
            required
            defaultValue={initial?.category}
            className={inputCls}
            placeholder="Atta, Chawal, Ghee…"
          />
          <datalist id="categories">
            {ITEM_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <Label htmlFor="baseUnit">Base unit</Label>
          <select
            id="baseUnit"
            name="baseUnit"
            defaultValue={initial?.baseUnit ?? "GRAM"}
            className={inputCls}
          >
            <option value="GRAM">Weight (grams / kg)</option>
            <option value="ML">Volume (ml / litre)</option>
          </select>
        </div>

        <div>
          <Label htmlFor="retailPricePerKg">Retail price (per kg / L)</Label>
          <Input id="retailPricePerKg" name="retailPricePerKg" type="number" min="0.01" step="0.01" required defaultValue={initial?.retailPricePerKg} />
        </div>

        <div>
          <Label htmlFor="wholesalePricePerKg">Wholesale price (per kg / L)</Label>
          <Input id="wholesalePricePerKg" name="wholesalePricePerKg" type="number" min="0.01" step="0.01" required defaultValue={initial?.wholesalePricePerKg} />
        </div>

        <div>
          <Label htmlFor="bagWeightKg">Bag weight (kg, optional)</Label>
          <Input id="bagWeightKg" name="bagWeightKg" type="number" min="0" step="0.1" defaultValue={initial?.bagWeightKg} placeholder="e.g. 20 or 40" />
        </div>

        <div>
          <Label htmlFor="lowStockThresholdKg">Low-stock alert below (kg / L)</Label>
          <Input id="lowStockThresholdKg" name="lowStockThresholdKg" type="number" min="0" step="0.1" defaultValue={initial?.lowStockThresholdKg} placeholder="e.g. 5" />
        </div>

        {editing ? (
          <div>
            <Label htmlFor="stockCorrectionKg">Correct current stock (kg / L)</Label>
            <Input id="stockCorrectionKg" name="stockCorrectionKg" type="number" min="0" step="0.001" placeholder="leave blank to keep" />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Only for manual stock-take fixes.</p>
          </div>
        ) : (
          <div>
            <Label htmlFor="openingStockKg">Opening stock (kg / L, optional)</Label>
            <Input id="openingStockKg" name="openingStockKg" type="number" min="0" step="0.001" placeholder="0" />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Usually filled by purchases instead.</p>
          </div>
        )}
      </div>

      <FormError message={state?.error} />
      <SubmitButton pendingText="Saving…">{editing ? "Save changes" : "Add item"}</SubmitButton>
    </form>
  );
}
