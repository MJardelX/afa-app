import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secundario" | "fantasma" | "acento";
  size?: "sm" | "md" | "lg";
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-[background-color,box-shadow,transform] duration-150 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

const variantes = {
  // --marca es celeste-700: 6.11:1 con blanco, en los dos temas.
  // No se aclara en oscuro porque celeste-600 baja a 4.27:1 y falla AA.
  primary: "bg-marca text-marca-texto shadow-sm hover:bg-marca-hover",
  secundario:
    "bg-marca-sutil text-marca-legible ring-1 ring-inset ring-borde hover:bg-superficie-2",
  fantasma: "text-marca-legible hover:bg-marca-sutil",
  // Amarillo como superficie con texto celeste oscuro encima, nunca al revés.
  acento: "bg-acento text-acento-texto shadow-sm hover:brightness-95",
} as const;

const tamanos = {
  sm: "h-8 px-3 text-[0.8rem]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[0.95rem]",
} as const;

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variantes[variant], tamanos[size], className)}
      {...props}
    />
  );
}
