/**
 * Punto único de lectura de variables de entorno.
 * Si falta una variable obligatoria, la app falla al arrancar y no en runtime.
 */
function requerida(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }
  return valor;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV,
  // Ejemplo de variable obligatoria cuando agregues base de datos:
  // databaseUrl: requerida("DATABASE_URL", process.env.DATABASE_URL),
};

export { requerida };
