"use client";

import { useActionState, useState } from "react";

import { iniciarSesion } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, null);
  const [verClave, setVerClave] = useState(false);

  return (
    <form action={accion} className="space-y-5">
      <Campo
        id="email"
        label="Correo"
        type="email"
        autoComplete="email"
        placeholder="nombre@afa.gt"
        icono={
          <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h12a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Zm1.9-.1L10 10l5.6-4.6" />
        }
      />

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            className="text-xs font-medium text-marca-legible hover:underline"
          >
            {verClave ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <div className="relative">
          <Icono>
            <path d="M6 8.5V6.8a4 4 0 1 1 8 0v1.7M4.8 8.5h10.4a1 1 0 0 1 1 1v6.2a1 1 0 0 1-1 1H4.8a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" />
          </Icono>
          <input
            id="password"
            name="password"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={entrada}
          />
        </div>
      </div>

      {estado?.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-peligro-fondo px-3 py-2.5 text-sm text-peligro ring-1 ring-inset ring-peligro/25"
        >
          <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 fill-current">
            <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.9 12H9.1v-1.8h1.8V14Zm0-3.2H9.1V5.6h1.8v5.2Z" />
          </svg>
          {estado.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={enviando} className="w-full">
        {enviando ? (
          <>
            <svg viewBox="0 0 20 20" className="size-4 animate-spin">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.3"
              />
              <path
                d="M18 10a8 8 0 0 0-8-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Ingresando…
          </>
        ) : (
          "Ingresar"
        )}
      </Button>
    </form>
  );
}

const entrada =
  "campo-vidrio h-11 w-full rounded-lg border pl-10 pr-3 text-sm text-texto " +
  "placeholder:text-suave transition-[border-color,box-shadow] " +
  "hover:border-celeste-300 focus:border-celeste-500 focus:outline-none " +
  "focus:ring-2 focus:ring-celeste-500/30";

function Icono({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="pointer-events-none absolute left-3 top-1/2 size-[1.15rem] -translate-y-1/2 fill-none stroke-tenue stroke-[1.5]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function Campo({
  id,
  label,
  icono,
  ...props
}: React.ComponentProps<"input"> & { label: string; icono: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Icono>{icono}</Icono>
        <input id={id} name={id} required className={entrada} {...props} />
      </div>
    </div>
  );
}
