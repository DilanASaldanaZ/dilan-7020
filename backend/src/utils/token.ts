/**
 * Emisión y verificación de los tokens de sesión.
 *
 * El token es un JWT firmado con el secreto del servidor. Contiene el id del
 * usuario, así que el backend puede saber quién está haciendo cada petición
 * sin guardar sesiones en memoria.
 */
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UnauthorizedError } from './errors.js';

/** Contenido mínimo del token de sesión. */
export interface SessionTokenPayload {
  /** Id del usuario autenticado. */
  sub: string;
  /** Correo del usuario autenticado. */
  email: string;
}

/** Firma un token de sesión para el usuario indicado. */
export function signSessionToken(userId: string, email: string): string {
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, email }, config.jwtSecret, options);
}

/**
 * Verifica un token de sesión.
 * @throws {UnauthorizedError} si el token es inválido o ya expiró.
 */
export function verifySessionToken(token: string): SessionTokenPayload {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new UnauthorizedError('La sesión no es válida. Inicia sesión de nuevo.');
    }
    return { sub: payload.sub, email: String(payload.email ?? '') };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Tu sesión expiró. Inicia sesión de nuevo.');
  }
}
