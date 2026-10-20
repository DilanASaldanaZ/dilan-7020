/**
 * Servicio de autenticación (frontend).
 * Habla con la API y devuelve datos ya normalizados.
 */
import type { AuthResponse, PublicUser } from '@carrera/shared';
import { apiRequest } from './api/client';

/** Datos que envía el formulario de registro. */
export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

/** Registra un usuario nuevo y devuelve su sesión. */
export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

/** Inicia sesión y devuelve la sesión del usuario. */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

/** Consulta el perfil del usuario autenticado (sirve para validar la sesión). */
export async function fetchCurrentUser(token: string): Promise<PublicUser> {
  const response = await apiRequest<{ user: PublicUser }>('/auth/me', { token });
  return response.user;
}

/** Cierra la sesión en el servidor. */
export async function logoutUser(token: string): Promise<void> {
  await apiRequest<never>('/auth/logout', { method: 'POST', token });
}
