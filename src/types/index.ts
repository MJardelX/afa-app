export type Item = {
  id: string;
  nombre: string;
  creadoEn: string;
};

/** Forma de respuesta que usan todas las rutas de `/api`. */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
