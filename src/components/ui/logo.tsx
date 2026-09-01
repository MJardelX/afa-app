import { cn } from "@/lib/utils";

/**
 * Monograma provisional de la academia: escudo celeste con balón y "AFA".
 * Cuando exista el logo oficial en vector, se reemplaza solo este archivo.
 */
export function Logo({
  className,
  titulo = "Academia de Fútbol Amistad",
}: {
  className?: string;
  titulo?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 72"
      role="img"
      aria-label={titulo}
      className={cn("size-12", className)}
    >
      <path
        d="M32 2 60 11v27c0 16-11.6 26.7-28 32C15.6 64.7 4 54 4 38V11L32 2Z"
        className="fill-celeste-600 dark:fill-celeste-500"
      />
      <path
        d="M32 2 60 11v27c0 16-11.6 26.7-28 32C15.6 64.7 4 54 4 38V11L32 2Z"
        className="fill-none stroke-amarillo-400"
        strokeWidth="2.5"
      />
      {/* Balón */}
      <circle cx="32" cy="27" r="11" className="fill-white" />
      <path
        d="m32 20 5.2 3.8-2 6.1h-6.4l-2-6.1L32 20Z"
        className="fill-celeste-900"
      />
      <path
        d="M32 16v4M21.5 24.5l3.6 2.6M42.5 24.5l-3.6 2.6M25.6 35.4l2-5.5M38.4 35.4l-2-5.5"
        className="stroke-celeste-900"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <text
        x="32"
        y="53"
        textAnchor="middle"
        className="fill-amarillo-300"
        style={{ font: "700 15px var(--font-sans)", letterSpacing: "0.06em" }}
      >
        AFA
      </text>
    </svg>
  );
}
