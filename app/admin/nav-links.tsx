"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Hand-drawn inline icons (no icon library) keyed by nav item. */
const ICONS: Record<string, React.ReactNode> = {
  dashboard: <path d="M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z" />,
  retail: <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3ZM9 8h6M9 12h6M9 16h4" />,
  wholesale: <path d="M3 4h2l2.5 12h11L21 7H6M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
  purchase: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM12 12l8-4.5M12 12 4 7.5M12 12v9" />,
  stock: <path d="M3 7h18v13H3zM3 7l2-4h14l2 4M9 11h6" />,
  suppliers: <path d="M3 13h11V6H3zM14 9h4l3 3v1h-7M6.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
  customers: <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M14.5 4.15A3.5 3.5 0 0 1 14.5 11" />,
  sales: <path d="M3 7h18v10H3zM3 11h18M7 15h3" />,
  reports: <path d="M4 4v16h16M8 16V10M12 16V6M16 16v-4M20 16v-8" />,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />,
};

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/sales/retail", label: "Retail Sale", icon: "retail" },
  { href: "/admin/sales/wholesale", label: "Wholesale Sale", icon: "wholesale" },
  { href: "/admin/purchases", label: "Purchases", icon: "purchase" },
  { href: "/admin/items", label: "Stock", icon: "stock" },
  { href: "/admin/suppliers", label: "Suppliers", icon: "suppliers" },
  { href: "/admin/customers", label: "Customers", icon: "customers" },
  { href: "/admin/sales", label: "Sales History", icon: "sales" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 pb-3 md:pb-0">
      {LINKS.map(({ href, label, icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300 ${
              active
                ? "bg-brand-300/20 text-white"
                : "text-brand-100/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span
              className={`absolute inset-y-1.5 left-0 w-1 rounded-full bg-brand-300 transition-opacity ${
                active ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            />
            <svg
              viewBox="0 0 24 24"
              className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                active ? "text-brand-300" : "text-brand-200/60 group-hover:text-brand-300"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {ICONS[icon]}
            </svg>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
