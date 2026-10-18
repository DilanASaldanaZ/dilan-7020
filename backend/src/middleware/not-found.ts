/**
 * Middleware para rutas inexistentes.
 * Se registra después de todas las rutas.
 */
import type { Request, Response } from 'express';
import { NotFoundError } from '../utils/errors.js';

export function notFoundHandler(req: Request, _res: Response, next: (error: unknown) => void): void {
  next(new NotFoundError(`La ruta ${req.method} ${req.originalUrl} no existe.`));
}
