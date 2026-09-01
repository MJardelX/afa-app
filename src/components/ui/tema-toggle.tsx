"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

type Tema = "light" | "dark" | "sistema";

/** Lo lee el script inline de layout.tsx antes de pintar, para evitar el destello. */
export const CLAVE_TEMA = "afa-tema";
const EVENTO = "afa-tema-cambio";

/* El tema vive en el DOM y en localStorage, no en estado de React. Por eso se
   lee con useSyncExternalStore: React se suscribe a una fuente externa en vez
   de duplicarla en un useState que habría que sincronizar con un efecto. */

function suscribir(alCambiar: () => void) {
  window.addEventListener(EVENTO, alCambiar);
  window.addEventListener("storage", alCambiar);
  return () => {
    window.removeEventListener(EVENTO, alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

function leer(): Tema {
  try {
    const v = localStorage.getItem(CLAVE_TEMA);
    return v === "dark" || v === "light" ? v : "sistema";
  } catch {
    return "sistema";
  }
}

// En el servidor no hay preferencia guardada: "sistema" es el valor coherente.
const leerEnServidor = (): Tema => "sistema";

function aplicar(tema: Tema) {
  const raiz = document.documentElement;
  try {
    if (tema === "sistema") {
      raiz.removeAttribute("data-theme");
      localStorage.removeItem(CLAVE_TEMA);
    } else {
      raiz.setAttribute("data-theme", tema);
      localStorage.setItem(CLAVE_TEMA, tema);
    }
  } catch {
    // Modo privado sin almacenamiento: el tema igual se aplica en esta sesión.
  }
  window.dispatchEvent(new Event(EVENTO));
}

const OPCIONES: { valor: Tema; etiqueta: string; icono: React.ReactNode }[] = [
  {
    valor: "light",
    etiqueta: "Tema claro",
    icono: (
      <>
        <circle cx="10" cy="10" r="3.6" />
        <path d="M10 2.2v1.6M10 16.2v1.6M2.2 10h1.6M16.2 10h1.6M4.5 4.5l1.1 1.1M14.4 14.4l1.1 1.1M15.5 4.5l-1.1 1.1M5.6 14.4l-1.1 1.1" />
      </>
    ),
  },
  {
    valor: "sistema",
    etiqueta: "Según el sistema",
    icono: (
      <>
        <rect x="2.5" y="3.5" width="15" height="10" rx="1.5" />
        <path d="M7 16.5h6" />
      </>
    ),
  },
  {
    valor: "dark",
    etiqueta: "Tema oscuro",
    icono: <path d="M16 11.4A6.6 6.6 0 0 1 8.6 4a6.8 6.8 0 1 0 7.4 7.4Z" />,
  },
];

export function TemaToggle({ className }: { className?: string }) {
  const tema = useSyncExternalStore(suscribir, leer, leerEnServidor);

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la interfaz"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-borde bg-superficie/60 p-0.5 backdrop-blur",
        className,
      )}
    >
      {OPCIONES.map((o) => {
        const activo = tema === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={o.etiqueta}
            title={o.etiqueta}
            onClick={() => aplicar(o.valor)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full transition-colors",
              activo
                ? "bg-marca text-marca-texto"
                : "text-tenue hover:bg-marca-sutil hover:text-marca-legible",
            )}
          >
            <svg
              viewBox="0 0 20 20"
              className="size-4 fill-none stroke-current stroke-[1.5]"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {o.icono}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
