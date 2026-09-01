import { cn } from "@/lib/utils";

export type NivelAsistencia = "buena" | "regular" | "baja";

export function nivelDeAsistencia(porcentaje: number): NivelAsistencia {
  if (porcentaje >= 85) return "buena";
  if (porcentaje >= 70) return "regular";
  return "baja";
}

/**
 * El semáforo NUNCA comunica por color solo: cada nivel lleva ícono propio y
 * etiqueta escrita. Además los colores no son verde/amarillo/rojo puros —
 * esa tríada es indistinguible en protanopia (ΔE 3.6 entre verde y amarillo).
 */
const NIVELES = {
  buena: {
    etiqueta: "Buena",
    clases: "bg-estado-buena-fondo text-estado-buena-texto",
    punto: "bg-estado-buena",
    icono: <path d="M5.5 10.4l3 3 6-6.4" />,
  },
  regular: {
    etiqueta: "Regular",
    clases: "bg-estado-regular-fondo text-estado-regular-texto",
    punto: "bg-estado-regular",
    icono: <path d="M10 3.8 17.5 16.2h-15L10 3.8ZM10 8.4v3.2M10 13.7v.1" />,
  },
  baja: {
    etiqueta: "Baja",
    clases: "bg-estado-baja-fondo text-estado-baja-texto",
    punto: "bg-estado-baja",
    icono: <path d="M6 6l8 8M14 6l-8 8" />,
  },
} as const;

export function EstadoAsistencia({
  nivel,
  porcentaje,
  className,
}: {
  nivel: NivelAsistencia;
  porcentaje?: number;
  className?: string;
}) {
  const n = NIVELES[nivel];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        n.clases,
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="size-3.5 fill-none stroke-current stroke-[2]"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {n.icono}
      </svg>
      {n.etiqueta}
      {porcentaje !== undefined && (
        <span className="tabular-nums opacity-80">{porcentaje}%</span>
      )}
    </span>
  );
}

/** Punto compacto para listas densas. Siempre acompañado de texto al lado. */
export function PuntoEstado({ nivel }: { nivel: NivelAsistencia }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 rounded-full", NIVELES[nivel].punto)}
    />
  );
}
