import { cerrarSesion } from "@/app/login/actions";
import { Logo } from "@/components/ui/logo";
import { TemaToggle } from "@/components/ui/tema-toggle";

const ETIQUETA_ROL: Record<string, string> = {
  director: "Director",
  coordinador: "Coordinador",
  entrenador: "Entrenador",
  tutor: "Tutor",
};

export function Encabezado({
  nombre,
  rol,
  temporada,
}: {
  nombre: string;
  rol: string;
  temporada?: string;
}) {
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    // Vidrio aquí porque el contenido se desplaza por debajo: es donde el
    // efecto aporta profundidad real en vez de ser decoración.
    <header className="vidrio sticky top-0 z-10 rounded-none border-x-0 border-t-0">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Logo className="size-8 lg:hidden" />

        {/* En escritorio la temporada ya está en la barra lateral: repetirla
            aquí solo duplica ruido. */}
        <div className="min-w-0 flex-1 lg:hidden">
          <p className="truncate text-sm font-semibold leading-tight">
            AFA Manager
          </p>
          {temporada && (
            <p className="truncate text-xs text-tenue">{temporada}</p>
          )}
        </div>
        <div className="hidden flex-1 lg:block" />

        <TemaToggle />

        <div className="hidden items-center gap-2.5 border-l border-borde pl-3 sm:flex">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-full bg-marca text-xs font-semibold text-marca-texto"
          >
            {iniciales}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium">{nombre}</p>
            <p className="text-xs text-tenue">{ETIQUETA_ROL[rol] ?? rol}</p>
          </div>
        </div>

        <form action={cerrarSesion}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="flex size-9 items-center justify-center rounded-lg text-tenue transition-colors hover:bg-marca-sutil hover:text-marca-legible"
          >
            <span className="sr-only">Cerrar sesión</span>
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              className="size-[1.15rem] fill-none stroke-current stroke-[1.5]"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.5 6V4.5a1.75 1.75 0 0 0-1.75-1.75h-5A1.75 1.75 0 0 0 4 4.5v11a1.75 1.75 0 0 0 1.75 1.75h5A1.75 1.75 0 0 0 12.5 15.5V14M8.75 10h8.5m0 0-2.5-2.5m2.5 2.5-2.5 2.5" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
