"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Light/dark toggle. Renders a neutral placeholder until mounted so the
 * server-rendered markup never guesses the client's resolved theme (avoids
 * a hydration mismatch — the standard next-themes pattern).
 */
const VARIANT_CLS = {
  // For chrome whose own background already flips with the theme (admin
  // header, portal header, login form panel).
  chrome:
    "border border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-slate-700 dark:hover:text-brand-400",
  // For the public-site nav, whose bar is permanently dark by brand design
  // (HOMEPAGE-REDESIGN.md) regardless of the light/dark toggle.
  onDark:
    "border border-white/20 bg-white/5 text-[var(--color-text-on-dark,#e4e7ec)] hover:border-[var(--color-accent,#0fbfa8)] hover:text-[var(--color-accent,#0fbfa8)] focus-visible:outline-[var(--color-accent,#0fbfa8)]",
} as const;

export function ThemeToggle({
  className = "",
  variant = "chrome",
}: {
  className?: string;
  variant?: keyof typeof VARIANT_CLS;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANT_CLS[variant]} ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
