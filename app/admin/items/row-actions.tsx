"use client";

import Link from "next/link";
import { useTransition } from "react";
import { btnRowCls } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import { deleteItem, setItemActive } from "@/lib/actions/items";

export function ItemRowActions({
  id,
  name,
  isActive,
}: {
  id: string;
  name: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/items/${id}/edit`} className={btnRowCls}>
        Edit
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => setItemActive(id, !isActive))}
        className={btnRowCls}
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
      <DeleteButton
        action={deleteItem.bind(null, id)}
        confirmMessage={`Delete "${name}"? This cannot be undone.`}
      />
    </div>
  );
}
