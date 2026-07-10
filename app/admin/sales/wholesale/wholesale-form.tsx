"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { createSale } from "@/lib/actions/sales";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton, inputCls, btnRowCls } from "@/components/ui";
import CustomerPicker, { type PickerCustomer } from "@/components/customer-picker";
import { formatMoney } from "@/lib/format";
import { formatQty } from "@/lib/units";

export type SaleItemOption = {
  id: string;
  name: string;
  category: string;
  baseUnit: "GRAM" | "ML";
  currentStock: number; // base units
  wholesalePricePerKg: string;
  bagWeightKg: string | null;
};

type Line = { itemId: string; mode: "kg" | "bag"; quantity: string; bagWeightKg: string; ratePerKg: string };
const emptyLine: Line = { itemId: "", mode: "kg", quantity: "", bagWeightKg: "", ratePerKg: "" };

export default function WholesaleForm({
  items,
  customers,
}: {
  items: SaleItemOption[];
  customers: PickerCustomer[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(createSale, undefined);
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }]);
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
  const [amountPaid, setAmountPaid] = useState("0");
  const [override, setOverride] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // When the admin confirms an oversell, resubmit with confirmOverStock=1.
  useEffect(() => {
    if (override) formRef.current?.requestSubmit();
  }, [override]);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function onPickItem(i: number, itemId: string) {
    const it = items.find((x) => x.id === itemId);
    updateLine(i, {
      itemId,
      ratePerKg: it?.wholesalePricePerKg ?? "",
      bagWeightKg: it?.bagWeightKg ?? "",
      mode: it?.bagWeightKg ? "bag" : "kg",
    });
  }

  const computed = lines.map((l) => {
    const qty = parseFloat(l.quantity) || 0;
    const rate = parseFloat(l.ratePerKg) || 0;
    const kg = l.mode === "bag" ? qty * (parseFloat(l.bagWeightKg) || 0) : qty;
    const grams = kg * 1000;
    const label = l.mode === "bag" ? `${qty} bag (${parseFloat(l.bagWeightKg) || 0} kg)` : `${qty} kg`;
    return { grams, rate, label, lineTotal: kg * rate };
  });
  const total = computed.reduce((a, b) => a + b.lineTotal, 0);
  const paidNum = paymentType === "CASH" ? total : parseFloat(amountPaid) || 0;
  const due = Math.max(0, total - paidNum);

  const itemsJson = useMemo(
    () =>
      JSON.stringify(
        lines
          .map((l, i) => ({ l, c: computed[i] }))
          .filter(({ l }) => l.itemId)
          .map(({ l, c }) => ({ itemId: l.itemId, quantityGrams: c.grams, quantityLabel: c.label, ratePerKg: c.rate })),
      ),
    [lines], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="channel" value="WHOLESALE" />
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="paymentType" value={paymentType} />
      <input type="hidden" name="confirmOverStock" value={override ? "1" : ""} />

      {/* Line items */}
      <div className="space-y-3">
        <Label>Items sold</Label>
        {lines.map((l, i) => {
          const it = items.find((x) => x.id === l.itemId);
          const stockLabel = it ? formatQty(it.currentStock, it.baseUnit) : "";
          return (
            <div key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <select value={l.itemId} onChange={(e) => onPickItem(i, e.target.value)} className={inputCls}>
                    <option value="">— Select item —</option>
                    {items.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name} · {x.category}
                      </option>
                    ))}
                  </select>
                  {it && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stockLabel} in stock</p>}
                </div>
                <div className="sm:col-span-2">
                  <select value={l.mode} onChange={(e) => updateLine(i, { mode: e.target.value as "kg" | "bag" })} className={inputCls}>
                    <option value="kg">kg</option>
                    <option value="bag">bags</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Input type="number" min="0" step="0.01" placeholder={l.mode === "bag" ? "bags" : "kg"} value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Input type="number" min="0" step="0.01" placeholder="rate/kg" value={l.ratePerKg} onChange={(e) => updateLine(i, { ratePerKg: e.target.value })} />
                </div>
                <div className="flex items-center justify-end sm:col-span-1">
                  {lines.length > 1 && (
                    <button type="button" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))} className="text-sm text-red-500 hover:text-red-600" aria-label="Remove">
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {l.mode === "bag" && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Bag weight (kg):</span>
                  <input type="number" min="0" step="0.1" value={l.bagWeightKg} onChange={(e) => updateLine(i, { bagWeightKg: e.target.value })} className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800" />
                </div>
              )}
              <div className="mt-2 text-right text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300">{formatMoney(computed[i]?.lineTotal || 0)}</div>
            </div>
          );
        })}
        <button type="button" onClick={() => setLines((p) => [...p, { ...emptyLine }])} className={btnRowCls}>
          + Add item
        </button>
      </div>

      {/* Payment */}
      <div>
        <Label>Payment</Label>
        <div className="flex gap-2">
          {(["CASH", "CREDIT"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPaymentType(t)}
              className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                paymentType === t
                  ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-400/10 dark:text-brand-300"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {t === "CASH" ? "Cash" : "Credit (udhaar)"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="method">Payment method</Label>
          <select id="method" name="method" className={inputCls} defaultValue="CASH">
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="EASYPAISA">EasyPaisa</option>
            <option value="JAZZCASH">JazzCash</option>
          </select>
        </div>
        {paymentType === "CREDIT" && (
          <div>
            <Label htmlFor="creditDays">Credit days</Label>
            <Input id="creditDays" name="creditDays" type="number" min="1" step="1" placeholder="e.g. 15 or 30" />
          </div>
        )}
      </div>

      {paymentType === "CREDIT" && (
        <div>
          <Label htmlFor="amountPaid">Amount paid now (Rs.)</Label>
          <Input id="amountPaid" name="amountPaid" type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
        </div>
      )}

      <CustomerPicker customers={customers} label={paymentType === "CREDIT" ? "Customer (required for credit)" : "Customer (optional)"} />

      {/* Totals */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Total</span>
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(total)}</span>
        </div>
        {paymentType === "CREDIT" && (
          <>
            <div className="mt-1 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Paid now</span>
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatMoney(paidNum)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Receivable (udhaar)</span>
              <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">{formatMoney(due)}</span>
            </div>
          </>
        )}
      </div>

      {state?.overStock && !override && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <p className="font-medium">
            Only {state.overStock.available} kg of {state.overStock.itemName} in stock, but {state.overStock.requested} kg requested.
          </p>
          <button type="button" onClick={() => setOverride(true)} className="mt-2 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
            Sell anyway (oversell)
          </button>
        </div>
      )}

      <FormError message={state?.error} />
      <SubmitButton pendingText="Recording…">Complete sale &amp; make invoice</SubmitButton>
    </form>
  );
}
