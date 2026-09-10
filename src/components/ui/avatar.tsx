import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Initials avatar. `src` is supported for a ready-to-use image URL, but the
 * app currently renders initials everywhere (no player photos). Pass
 * `ringColor` for a thin coloured rim (e.g. the player's category colour).
 */
const SIZES = {
  sm: "size-7 text-[0.65rem]",
  md: "size-10 text-xs",
  lg: "size-16 text-base",
  xl: "size-20 text-lg",
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  ringColor,
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  ringColor?: string | null;
  className?: string;
}) {
  const ringed = !!ringColor;
  const base = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
    !ringed && "ring-1 ring-inset ring-line",
    SIZES[size],
    className,
  );
  const style = ringed
    ? ({
        boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px ${ringColor}`,
      } as CSSProperties)
    : undefined;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={style}
        className={cn(base, "object-cover")}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        base,
        ringed
          ? "bg-surface-2 text-fg-muted"
          : "bg-gradient-to-br from-brand to-brand-hover text-brand-fg",
      )}
    >
      {initials(name)}
    </span>
  );
}
