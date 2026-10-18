/**
 * Middleware que exige una sesión activa.
 *
 * Lee la cabecera `Authorization: Bearer <token>`, valida el token y carga el
 * usuario en `req.user`. Si algo falla, responde 401 con un mensaje claro.
 */
import type { NextFunction, Request, Response } from 'express';
import type { UserRepository } from '../repositories/user.repository.js';
import { UnauthorizedError } from '../utils/errors.js';
import { verifySessionToken } from '../utils/token.js';

export function createRequireAuth(users: UserRepository) {
  return function requireAuth(req: Request, _res: Response, next: NextFunction): void {
    try {
      const header = req.header('authorization');
      if (!header || !header.toLowerCase().startsWith('bearer ')) {
        throw new UnauthorizedError();
      }

      const token = header.slice(7).trim();
      const payload = verifySessionToken(token);
      const user = users.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedError('Tu sesión ya no es válida. Inicia sesión de nuevo.');
      }

      req.user = users.toPublic(user);
      next();
    } catch (error) {
      next(error);
    }
  };
}
