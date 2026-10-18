/**
 * Middleware final de errores.
 *
 * Convierte cualquier error en una respuesta JSON con la misma forma:
 *   { "error": { "code": "...", "message": "...", "details": ... } }
 *
 * Así el frontend siempre sabe cómo leer un error.
 */
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  logger.error('Error no controlado en la API', {
    message: error instanceof Error ? error.message : String(error),
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    },
  });
}
