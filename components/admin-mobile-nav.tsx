"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import NavLinks from "@/app/admin/nav-links";
import { BrandLockup } from "@/components/logo";

/**
 * Mobile-only top bar for the admin panel: brand + hamburger that opens a
 * slide-over drawer holding the same NavLinks used by the desktop sidebar.
 *
 * The overlay + drawer are rendered through a portal to <body>. This is
 * essential: the admin header uses `backdrop-blur` (a backdrop-filter), which
 * makes the header a containing block for fixed-position descendants — a drawer
 * rendered inside it would be clipped to the header's height and only show one
 * or two links. Portalling to body keeps it viewport-anchored and full height.
 */
export default function AdminMobileNav({
  email,
  signOut,
}: {
  email: string;
  signOut: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll while the drawer is open, and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Trigger (stays in the header) */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <BrandLockup size={32} textClassName="text-base" />
      </div>

      {/* Overlay + drawer portalled to <body> so the header's backdrop-filter
          can't clip them. */}
      {mounted &&
        createPortal(
          <div className="md:hidden">
            <div
              onClick={() => setOpen(false)}
              aria-hidden="true"
              className={`fixed inset-0 z-[100] bg-navy-950/60 transition-opacity duration-200 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />

            <aside
              className={`fixed inset-y-0 left-0 z-[101] flex h-full w-72 max-w-[85%] flex-col bg-navy-900 shadow-2xl transition-transform duration-200 ease-out ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              {/* Drawer header */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-navy-700/60 px-4 py-4">
                <div className="leading-tight">
                  <BrandLockup onDark size={38} textClassName="text-lg" />
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-brand-300">Business Portal</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              {/* Links (scroll if the list is taller than the screen) */}
              <div className="flex-1 overflow-y-auto overscroll-contain py-3">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-navy-700/60 px-4 py-4">
                {email && (
                  <p className="mb-3 truncate text-xs text-slate-400">
                    Signed in as <span className="font-medium text-slate-200">{email}</span>
                  </p>
                )}
                {signOut}
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  );
}
