/**
 * Pruebas del cliente HTTP: timeout, errores de red y errores de la API.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from '../services/api/client';

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve el cuerpo de la respuesta cuando todo sale bien', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await apiRequest<{ ok: boolean }>('/salud');

    expect(result).toEqual({ ok: true });
  });

  it('lanza un ApiError con el mensaje que devuelve la API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Necesitas iniciar sesión.' } }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    await expect(apiRequest('/privado')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Necesitas iniciar sesión.',
    });
  });

  it('reporta un error de red cuando el servidor no está disponible', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    await expect(apiRequest('/salud')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('cancela la petición cuando se supera el tiempo de espera', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );

    await expect(apiRequest('/salud', { timeoutMs: 10 })).rejects.toMatchObject({
      status: 0,
      code: 'TIMEOUT',
    });
  });

  it('envía el token de sesión en la cabecera Authorization', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({}), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/privado', { token: 'abc123' });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc123');
  });
});

describe('ApiError', () => {
  it('guarda el código, el estado y el cuerpo de la respuesta', () => {
    const error = new ApiError(422, 'VALIDATION_ERROR', 'Datos inválidos', { details: {} });

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.data).toEqual({ details: {} });
  });
});
