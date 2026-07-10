/**
 * Badar Natural Foods wordmark — the brand has no separate logomark (the
 * marketing site is wordmark-only). "Badar" in the display serif, "Natural"
 * underlined in mustard-gold, matching badarnatural.com. Swap in a logo file
 * here later if one is supplied.
 */
export default function Wordmark({
  onDark = false,
  className = "",
}: {
  onDark?: boolean;
  className?: string;
}) {
  const base = onDark ? "text-white" : "text-navy-900 dark:text-brand-100";
  return (
    <span className={`font-display text-lg font-bold tracking-tight ${base} ${className}`}>
      Badar{" "}
      <span className="underline decoration-brand-300 decoration-2 underline-offset-4">
        Natural
      </span>
    </span>
  );
}
