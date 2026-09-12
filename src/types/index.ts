/** Response shape used by the `/api` routes. */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
