/**
 * Servicio de recargas de saldo (frontend).
 */
import type { PublicUser, ShellPayResponse } from '@carrera/shared';
import { ApiError, apiRequest } from './api/client';

/** Datos que envía el formulario de recarga. */
export interface TopUpPayload {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolder: string;
  amount: number;
}

/** Respuesta de una recarga (aprobada o no). */
export interface TopUpResult {
  payment: ShellPayResponse;
  user: PublicUser;
}

/** Opciones de la recarga. */
export interface TopUpOptions {
  /** Simula que la pasarela tiene un problema interno. */
  simulateSystemError?: boolean;
}

/**
 * Solicita una recarga de saldo.
 *
 * Si la pasarela rechaza la operación, la API responde con un error 422/503
 * pero el cuerpo trae el detalle de la operación. Aquí se conserva ese cuerpo
 * dentro del error para que la interfaz pueda mostrar el mensaje exacto.
 */
export async function topUp(
  payload: TopUpPayload,
  token: string,
  options: TopUpOptions = {},
): Promise<TopUpResult> {
  try {
    return await apiRequest<TopUpResult>('/payments/top-up', {
      method: 'POST',
      body: payload,
      token,
      headers: options.simulateSystemError ? { 'x-shellpay-mode': 'system_error' } : {},
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // Se vuelve a lanzar el mismo error, pero conservando el cuerpo.
      throw new ApiError(error.status, error.code, error.message, error.data);
    }
    throw error;
  }
}

/**
 * Extrae la respuesta de la pasarela de un error.
 * Devuelve `null` si el error no viene de la pasarela (por ejemplo, un timeout).
 */
export function extractPaymentFromError(error: unknown): ShellPayResponse | null {
  if (!(error instanceof ApiError)) return null;

  const data = error.data as { payment?: ShellPayResponse } | null;
  return data?.payment ?? null;
}
