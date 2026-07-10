"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/ledger", label: "Ledger" },
  { href: "/portal/invoices", label: "Invoices" },
];

/** Customer portal top tabs, with the active tab highlighted in mustard-gold. */
export default function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {TABS.map((t) => {
        const active =
          t.href === "/portal" ? pathname === "/portal" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-brand-300 text-navy-900"
                : "text-brand-100/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
