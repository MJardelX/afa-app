import type { ApiResponse } from "@/types";

/**
 * Cliente HTTP para las rutas de `/api`. Desenvuelve `ApiResponse`
 * y lanza en caso de error para poder usar try/catch en los componentes.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  const body = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !body.ok) {
    throw new Error(body.ok ? `Error ${res.status}` : body.error);
  }

  return body.data;
}
