"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarcodeInput } from "@/components/barcode-input";

/**
 * Scan-to-search on the stock list (§7.1). A matched barcode jumps straight to
 * that item's edit screen; an unknown barcode offers to create a new item with
 * the code pre-filled.
 */
export function ItemBarcodeSearch({ map }: { map: Record<string, string> }) {
  const router = useRouter();
  const [notFound, setNotFound] = useState<string | null>(null);

  function onScan(code: string) {
    const id = map[code];
    if (id) {
      setNotFound(null);
      router.push(`/admin/items/${id}/edit`);
    } else {
      setNotFound(code);
    }
  }

  return (
    <div className="w-full sm:w-72">
      <BarcodeInput onScan={onScan} placeholder="Scan to find an item…" />
      {notFound && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          No item for {notFound}.{" "}
          <Link href={`/admin/items/new?barcode=${encodeURIComponent(notFound)}`} className="font-semibold text-brand-700 underline dark:text-brand-400">
            Add it →
          </Link>
        </p>
      )}
    </div>
  );
}
