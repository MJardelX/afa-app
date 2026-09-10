import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The academy crest (`public/afa-logo.png`, transparent). The box is square —
 * sized by the caller (`size-6`, `size-11`, …) — and the crest, being taller
 * than wide, is centered inside it with `object-contain`. No default `size-*`
 * here: Tailwind can't reliably override one `size-*` with another.
 */
export function Logo({
  className = "size-8",
  title = "Amistad Football Academy",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <Image
      src="/afa-logo.png"
      alt={title}
      width={408}
      height={612}
      priority
      // Largest use is the login screen (~96px). Cap the srcSet so the
      // optimizer never ships the full-res candidate for a 24px sidebar slot.
      sizes="256px"
      className={cn("object-contain", className)}
    />
  );
}
