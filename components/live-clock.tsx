"use client";

import { useEffect, useState } from "react";
import { PK_TZ } from "@/lib/format";

/**
 * Live Pakistan-time clock. Ticks every second on the client. Renders a stable
 * placeholder on the server / first paint so there's no hydration mismatch.
 */
export default function LiveClock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: PK_TZ,
      })
    : "--:--:--";
  const date = now
    ? now.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: PK_TZ,
      })
    : "";

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      suppressHydrationWarning
      title="Pakistan time"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{time}</span>
      {date && <span className="text-xs text-slate-500 dark:text-slate-400">{date} · PKT</span>}
    </span>
  );
}
