"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconoNav, NAVEGACION } from "@/components/app/navegacion";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export function BarraLateral({ temporada }: { temporada?: string }) {
  const ruta = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-borde bg-superficie-2 lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logo className="size-9" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            AFA Manager
          </p>
          {temporada && (
            <p className="truncate text-xs text-tenue">{temporada}</p>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAVEGACION.map((item) => {
          const activo = ruta === item.href;

          if (!item.listo) {
            return (
              <span
                key={item.href}
                aria-disabled
                title="Disponible en una próxima etapa"
                className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm text-suave"
              >
                <IconoNav>{item.icono}</IconoNav>
                <span className="flex-1">{item.etiqueta}</span>
                <span className="rounded-full bg-superficie px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-tenue ring-1 ring-inset ring-borde">
                  Pronto
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                activo
                  ? "bg-marca font-medium text-marca-texto"
                  : "text-tenue hover:bg-marca-sutil hover:text-marca-legible",
              )}
            >
              <IconoNav>{item.icono}</IconoNav>
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>

      <p className="px-5 pb-5 text-[0.7rem] leading-relaxed text-suave">
        Academia de Fútbol Amistad
      </p>
    </aside>
  );
}
