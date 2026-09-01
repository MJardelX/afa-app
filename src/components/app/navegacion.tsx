import type { ReactNode } from "react";

export type ItemNav = {
  href: string;
  etiqueta: string;
  corta: string;
  icono: ReactNode;
  listo: boolean;
};

/** Fuente única del menú: la usan la barra lateral y la barra inferior móvil. */
export const NAVEGACION: ItemNav[] = [
  {
    href: "/",
    etiqueta: "Panel",
    corta: "Panel",
    listo: true,
    icono: (
      <>
        <rect x="2.75" y="2.75" width="6" height="6" rx="1.5" />
        <rect x="11.25" y="2.75" width="6" height="6" rx="1.5" />
        <rect x="2.75" y="11.25" width="6" height="6" rx="1.5" />
        <rect x="11.25" y="11.25" width="6" height="6" rx="1.5" />
      </>
    ),
  },
  {
    href: "/jugadores",
    etiqueta: "Jugadores",
    corta: "Jugadores",
    listo: false,
    icono: (
      <>
        <circle cx="7.5" cy="6.5" r="2.75" />
        <path d="M2.75 16.5c0-2.6 2.1-4.25 4.75-4.25s4.75 1.65 4.75 4.25" />
        <path d="M13.5 4.2a2.6 2.6 0 0 1 0 4.9M14.75 12.6c1.6.45 2.5 1.8 2.5 3.9" />
      </>
    ),
  },
  {
    href: "/asistencia",
    etiqueta: "Asistencia",
    corta: "Asistencia",
    listo: false,
    icono: (
      <>
        <rect x="2.75" y="4" width="14.5" height="13.25" rx="2" />
        <path d="M2.75 8h14.5M6.5 2.75v2.5M13.5 2.75v2.5" />
        <path d="m7 12.4 1.9 1.9 3.6-3.6" />
      </>
    ),
  },
  {
    href: "/evaluacion",
    etiqueta: "Evaluación",
    corta: "Evaluar",
    listo: false,
    icono: (
      <>
        <path d="M3.5 16.5v-5M8 16.5V6.5M12.5 16.5v-7M17 16.5v-11" />
      </>
    ),
  },
  {
    href: "/equipos",
    etiqueta: "Equipos",
    corta: "Equipos",
    listo: false,
    icono: (
      <>
        <circle cx="10" cy="10" r="7.25" />
        <path d="m10 5.4 3.6 2.6-1.4 4.3H7.8L6.4 8 10 5.4Z" />
      </>
    ),
  },
  {
    href: "/reportes",
    etiqueta: "Reportes",
    corta: "Reportes",
    listo: false,
    icono: (
      <>
        <path d="M11.5 2.75H5.75a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2h8.5a2 2 0 0 0 2-2V7.5Z" />
        <path d="M11.25 2.9V7.5h4.6M7 11h6M7 14h4" />
      </>
    ),
  },
];

export function IconoNav({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="size-[1.15rem] shrink-0 fill-none stroke-current stroke-[1.5]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
