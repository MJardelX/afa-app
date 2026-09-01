"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconoNav, NAVEGACION } from "@/components/app/navegacion";
import { cn } from "@/lib/utils";

/**
 * Navegación móvil. El entrenador usa el sistema en la cancha, con el celular
 * en una mano: barra inferior al alcance del pulgar, no un menú hamburguesa.
 * El vidrio sí rinde aquí, porque el contenido se desplaza por debajo.
 */
export function NavInferior() {
  const ruta = usePathname();

  return (
    <nav className="vidrio fixed inset-x-0 bottom-0 z-20 flex justify-around rounded-none border-x-0 border-b-0 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      {NAVEGACION.map((item) => {
        const activo = ruta === item.href;
        const clases = cn(
          "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[0.65rem]",
          activo ? "text-marca-legible" : "text-tenue",
          !item.listo && "text-suave",
        );

        if (!item.listo) {
          return (
            <span key={item.href} aria-disabled className={clases}>
              <IconoNav>{item.icono}</IconoNav>
              {item.corta}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={clases}
          >
            <IconoNav>{item.icono}</IconoNav>
            {item.corta}
          </Link>
        );
      })}
    </nav>
  );
}
