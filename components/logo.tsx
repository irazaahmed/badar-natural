import Image from "next/image";
import Wordmark from "@/components/wordmark";

/**
 * Badar Natural Foods logomark — the circular "Al-Badr Atta Chakki" emblem
 * supplied by the client (public/Logo.jpeg). The source is a square JPEG with a
 * dark-green field, so we render it inside a round frame (object-cover keeps the
 * emblem centred) with a soft gold ring to match the espresso/mustard theme.
 */
export function Logo({
  size = 40,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#14361f] ring-1 ring-brand-300/40 shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/Logo.jpeg"
        alt="Badar Natural Foods logo"
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

/**
 * Logo + wordmark lockup for headers, nav bars and the login card. `size` is the
 * logomark diameter in px; `textClassName` sizes the wordmark next to it.
 */
export function BrandLockup({
  onDark = false,
  size = 40,
  textClassName = "text-lg",
  className = "",
  priority = false,
}: {
  onDark?: boolean;
  size?: number;
  textClassName?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Logo size={size} priority={priority} />
      <Wordmark onDark={onDark} className={textClassName} />
    </span>
  );
}

export default Logo;
