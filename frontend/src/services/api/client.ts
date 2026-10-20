/**
 * Cliente HTTP de la API.
 *
 * Centraliza tres cosas que si no se repetirían en cada servicio:
 *  1. La URL base y el token de sesión.
 *  2. El tiempo de espera (timeout) de cada petición.
 *  3. La traducción de los errores a un tipo único (`ApiError`).
 */

import type { ApiErrorBody } from '@carrera/shared';

/** URL base de la API. Se puede cambiar con la variable VITE_API_URL. */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

/** Tiempo de espera por defecto de una petición: 10 segundos. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Error normalizado de la API. Todos los servicios lanzan este tipo. */
export class ApiError extends Error {
  constructor(
    /** Código HTTP. `0` significa que la petición ni siquiera llegó al servidor. */
    public readonly status: number,
    /** Código interno estable (por ejemplo `TIMEOUT`, `UNAUTHORIZED`). */
    public readonly code: string,
    message: string,
    /** Cuerpo crudo de la respuesta, por si el frontend necesita algún detalle. */
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Opciones de una petición a la API. */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Token de sesión. Si viene, se manda en la cabecera `Authorization`. */
  token?: string | null;
  /** Tiempo de espera en milisegundos. */
  timeoutMs?: number;
  /** Cabeceras extra. */
  headers?: Record<string, string>;
}

/** Ejecuta una petición contra la API y devuelve el cuerpo ya parseado. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    token = null,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers = {},
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders: Record<string, string> = { ...headers };
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
  if (token) requestHeaders['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    // Si se abortó, fue por timeout.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        0,
        'TIMEOUT',
        'La solicitud tardó demasiado y se canceló. Revisa tu conexión e inténtalo de nuevo.',
      );
    }
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'No pudimos conectar con el servidor. Revisa que el backend esté encendido.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const rawBody = await response.text();
  const parsedBody = rawBody.length > 0 ? safeParseJson(rawBody) : null;

  if (!response.ok) {
    const errorBody = parsedBody as ApiErrorBody | null;
    const message =
      errorBody?.error?.message ??
      `La operación falló con el código ${response.status}. Inténtalo de nuevo.`;
    const code = errorBody?.error?.code ?? `HTTP_${response.status}`;

    throw new ApiError(response.status, code, message, parsedBody);
  }

  return parsedBody as T;
}

/** Convierte un texto en JSON sin romper la aplicación si el JSON está mal formado. */
function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
