"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { createSale } from "@/lib/actions/sales";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton, inputCls } from "@/components/ui";
import CustomerPicker, { type PickerCustomer } from "@/components/customer-picker";
import { BarcodeInput } from "@/components/barcode-input";
import { formatMoney } from "@/lib/format";
import { formatQty, formatKg, RETAIL_PRESETS, parseQtyToGrams } from "@/lib/units";

export type RetailItemOption = {
  id: string;
  name: string;
  category: string;
  baseUnit: "GRAM" | "ML";
  currentStock: number;
  retailPricePerKg: string;
  barcode: string | null;
  defaultPackWeightGrams: number | null;
};

type CartLine = { itemId: string; name: string; grams: number; label: string; ratePerKg: number; lineTotal: number };

export default function RetailForm({
  items,
  customers,
}: {
  items: RetailItemOption[];
  customers: PickerCustomer[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(createSale, undefined);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
  const [amountPaid, setAmountPaid] = useState("0");
  const [override, setOverride] = useState(false);
  const [confirmLimit, setConfirmLimit] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Draft line being built
  const [itemId, setItemId] = useState("");
  const [freeKg, setFreeKg] = useState("");
  const [rate, setRate] = useState("");
  const [scanMsg, setScanMsg] = useState<string | null>(null);

  const selected = useMemo(() => items.find((x) => x.id === itemId), [items, itemId]);
  const byBarcode = useMemo(() => {
    const m = new Map<string, RetailItemOption>();
    for (const it of items) if (it.barcode) m.set(it.barcode, it);
    return m;
  }, [items]);

  // Scan handler (§8.3): pre-packaged items drop straight into the cart at their
  // pack size; loose items are pulled into the draft so weight can be entered.
  function onScan(code: string) {
    const it = byBarcode.get(code);
    if (!it) {
      setScanMsg(`Barcode ${code} not recognized — search manually below.`);
      return;
    }
    const r = parseFloat(it.retailPricePerKg) || 0;
    if (it.defaultPackWeightGrams && it.defaultPackWeightGrams > 0) {
      const grams = it.defaultPackWeightGrams;
      setCart((prev) => [
        ...prev,
        { itemId: it.id, name: it.name, grams, label: formatKg(grams / 1000, it.baseUnit), ratePerKg: r, lineTotal: (grams / 1000) * r },
      ]);
      setScanMsg(`Added ${it.name} (${formatKg(grams / 1000, it.baseUnit)}).`);
    } else {
      onSelectItem(it.id);
      setScanMsg(`${it.name} — enter the weight.`);
    }
  }

  useEffect(() => {
    if (override || confirmLimit) formRef.current?.requestSubmit();
  }, [override, confirmLimit]);

  function onSelectItem(id: string) {
    setItemId(id);
    const it = items.find((x) => x.id === id);
    setRate(it?.retailPricePerKg ?? "");
    setFreeKg("");
  }

  function addLine(grams: number, label: string) {
    if (!selected) return;
    const r = parseFloat(rate) || parseFloat(selected.retailPricePerKg) || 0;
    if (grams <= 0 || r <= 0) return;
    setCart((prev) => [
      ...prev,
      { itemId: selected.id, name: selected.name, grams, label, ratePerKg: r, lineTotal: (grams / 1000) * r },
    ]);
    setItemId("");
    setFreeKg("");
    setRate("");
  }

  function addFree() {
    const grams = parseQtyToGrams(freeKg);
    if (grams) addLine(grams, `${(grams / 1000).toString()} kg`);
  }

  const total = cart.reduce((a, b) => a + b.lineTotal, 0);
  const paidNum = paymentType === "CASH" ? total : parseFloat(amountPaid) || 0;
  const due = Math.max(0, total - paidNum);

  const itemsJson = useMemo(
    () => JSON.stringify(cart.map((c) => ({ itemId: c.itemId, quantityGrams: c.grams, quantityLabel: c.label, ratePerKg: c.ratePerKg }))),
    [cart],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Draft entry */}
      <div className="space-y-4">
        <div>
          <Label>Scan barcode</Label>
          <BarcodeInput onScan={onScan} autoFocus placeholder="Scan item, or search below…" />
          {scanMsg && <p className="mt-1 text-xs text-brand-700 dark:text-brand-400">{scanMsg}</p>}
        </div>

        <div>
          <Label htmlFor="item">Item</Label>
          <select id="item" value={itemId} onChange={(e) => onSelectItem(e.target.value)} className={inputCls}>
            <option value="">— Select item —</option>
            {items.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · {x.category}
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatQty(selected.currentStock, selected.baseUnit)} in stock · retail {formatMoney(selected.retailPricePerKg)}/kg
            </p>
          )}
        </div>

        {selected && (
          <>
            <div>
              <Label htmlFor="rate">Rate (per kg)</Label>
              <Input id="rate" type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>

            <div>
              <Label>Quick quantity</Label>
              <div className="flex flex-wrap gap-2">
                {RETAIL_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => addLine(p.grams, p.label)}
                    className="rounded-full bg-brand-300 px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-brand-200"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="freeKg">Or custom weight</Label>
              <div className="flex gap-2">
                <Input id="freeKg" placeholder="e.g. 2.5 (kg) or 750g" value={freeKg} onChange={(e) => setFreeKg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFree())} />
                <button type="button" onClick={addFree} className="shrink-0 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
                  Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cart + submit */}
      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="channel" value="RETAIL" />
        <input type="hidden" name="items" value={itemsJson} />
        <input type="hidden" name="paymentType" value={paymentType} />
        <input type="hidden" name="confirmOverStock" value={override ? "1" : ""} />
        <input type="hidden" name="confirmCreditLimit" value={confirmLimit ? "1" : ""} />

        <div className="rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
            Receipt ({cart.length})
          </div>
          {cart.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">Add items from the left.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {cart.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{c.label} @ {formatMoney(c.ratePerKg)}/kg</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums">{formatMoney(c.lineTotal)}</span>
                    <button type="button" onClick={() => setCart((p) => p.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-600" aria-label="Remove">
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Total</span>
            <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(total)}</span>
          </div>
        </div>

        {/* Payment */}
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
              {t === "CASH" ? "Cash" : "Credit"}
            </button>
          ))}
        </div>

        {paymentType === "CREDIT" && (
          <>
            <div>
              <Label htmlFor="amountPaid">Amount paid now (Rs.)</Label>
              <Input id="amountPaid" name="amountPaid" type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
              <p className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Remaining (udhaar)</span>
                <span className="tabular-nums text-amber-600 dark:text-amber-400">{formatMoney(due)}</span>
              </p>
            </div>
            <CustomerPicker customers={customers} label="Customer (required for credit)" />
          </>
        )}

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

        {state?.creditLimit && !confirmLimit && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <p className="font-medium">
              {state.creditLimit.customerName} would owe {formatMoney(state.creditLimit.afterSale)} after this sale, over their credit limit of {formatMoney(state.creditLimit.limit)}.
            </p>
            <button type="button" onClick={() => setConfirmLimit(true)} className="mt-2 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
              Sell on credit anyway
            </button>
          </div>
        )}

        <FormError message={state?.error} />
        <SubmitButton pendingText="Completing…">Complete sale</SubmitButton>
      </form>
    </div>
  );
}
