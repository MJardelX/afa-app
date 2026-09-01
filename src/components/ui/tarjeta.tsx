import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Contenedor sólido, no de vidrio. El vidrio se reserva para las capas que
 * flotan sobre contenido (encabezado, nav móvil, tarjeta de sesión). Para
 * datos que se leen a diario, una superficie opaca es más legible.
 */
export function Tarjeta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-borde bg-superficie p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function TituloTarjeta({
  children,
  extra,
}: {
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold">{children}</h2>
      {extra && <span className="text-xs text-tenue">{extra}</span>}
    </div>
  );
}

/** Cifra suelta: no lleva gráfica ni interacción, el número es el mensaje. */
export function Indicador({
  titulo,
  valor,
  detalle,
  acento,
}: {
  titulo: string;
  valor: string | number;
  detalle?: string;
  acento?: boolean;
}) {
  return (
    <div className="rounded-xl border border-borde bg-superficie p-4 shadow-sm">
      <p className="text-xs font-medium text-tenue">{titulo}</p>
      <p
        className={cn(
          "mt-1.5 text-[1.75rem] font-semibold leading-none tabular-nums",
          acento && "text-marca-legible",
        )}
      >
        {valor}
      </p>
      {detalle && <p className="mt-1.5 text-xs text-tenue">{detalle}</p>}
    </div>
  );
}
