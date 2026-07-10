import prisma from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { formatQty } from "@/lib/units";
import {
  PageHeader,
  LinkButton,
  Table,
  Th,
  Td,
  Badge,
  EmptyState,
} from "@/components/ui";
import { ItemRowActions } from "./row-actions";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Stock"
        description="One inventory shared by retail and wholesale. Stock moves only through purchases and sales."
        action={<LinkButton href="/admin/items/new">+ New item</LinkButton>}
      />

      {items.length === 0 ? (
        <EmptyState
          title="No items yet"
          hint="Add your kitchen staples — atta, chawal, ghee, oil — to start tracking stock."
          action={<LinkButton href="/admin/items/new">+ New item</LinkButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th>Category</Th>
              <Th className="text-right">In stock</Th>
              <Th className="text-right">Retail /kg</Th>
              <Th className="text-right">Wholesale /kg</Th>
              <Th className="text-right">Last buy /kg</Th>
              <Th className="text-right">Margin</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const base = it.baseUnit === "ML" ? "ML" : "GRAM";
              const stock = Number(it.currentStock);
              const low = stock <= Number(it.lowStockThreshold);
              const lastBuy = it.lastPurchasePricePerKg ? Number(it.lastPurchasePricePerKg) : null;
              const retail = Number(it.retailPricePerKg);
              const marginPct = lastBuy && lastBuy > 0 ? ((retail - lastBuy) / lastBuy) * 100 : null;
              return (
                <tr key={it.id} className={it.isActive ? "" : "opacity-50"}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">
                    {it.name}
                    {!it.isActive && <span className="ml-2 text-xs text-slate-400">(inactive)</span>}
                  </Td>
                  <Td>{it.category}</Td>
                  <Td className="text-right tabular-nums">
                    <span className="inline-flex items-center gap-2">
                      {formatQty(stock, base)}
                      {low && stock >= 0 && <Badge tone="amber">Low</Badge>}
                      {stock < 0 && <Badge tone="red">Oversold</Badge>}
                    </span>
                  </Td>
                  <Td className="text-right tabular-nums">{formatMoney(it.retailPricePerKg)}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(it.wholesalePricePerKg)}</Td>
                  <Td className="text-right tabular-nums">
                    {it.lastPurchasePricePerKg ? formatMoney(it.lastPurchasePricePerKg) : "—"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {marginPct === null ? (
                      "—"
                    ) : (
                      <span className={marginPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {marginPct >= 0 ? "+" : ""}
                        {marginPct.toFixed(0)}%
                      </span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <ItemRowActions id={it.id} name={it.name} isActive={it.isActive} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
