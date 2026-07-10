import { inputCls, btnPrimaryCls } from "@/components/ui";

/**
 * Date-range (and optional channel) filter bar for report pages. A plain GET
 * form — no client JS — so report URLs are shareable/bookmarkable and the range
 * round-trips through the query string.
 */
export function ReportFilters({
  action,
  fromInput,
  toInput,
  channel,
  showChannel = false,
}: {
  action: string;
  fromInput: string;
  toInput: string;
  channel?: string;
  showChannel?: boolean;
}) {
  return (
    <form method="get" action={action} className="mb-6 flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="from" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
        <input id="from" type="date" name="from" defaultValue={fromInput} className={inputCls} />
      </div>
      <div>
        <label htmlFor="to" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
        <input id="to" type="date" name="to" defaultValue={toInput} className={inputCls} />
      </div>
      {showChannel && (
        <div>
          <label htmlFor="channel" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Channel</label>
          <select id="channel" name="channel" defaultValue={channel ?? "all"} className={inputCls}>
            <option value="all">All</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
          </select>
        </div>
      )}
      <button type="submit" className={btnPrimaryCls}>Apply</button>
    </form>
  );
}
