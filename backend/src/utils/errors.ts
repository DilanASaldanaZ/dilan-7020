/**
 * Errores de la aplicación.
 *
 * Cada error de negocio tiene un código HTTP y un código interno estable.
 * El middleware de errores los convierte a respuestas JSON consistentes.
 */

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

/** La entrada del cliente no cumple las reglas del formulario. */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

/** No hay sesión activa o el token no es válido. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Necesitas iniciar sesión para continuar.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

/** El recurso ya existe (por ejemplo, un correo registrado). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

/** El usuario no existe. */
export class NotFoundError extends AppError {
  constructor(message = 'No encontramos lo que buscas.') {
    super(404, 'NOT_FOUND', message);
  }
}

/** Error interno no controlado. */
export class InternalError extends AppError {
  constructor(message = 'Ocurrió un error inesperado. Inténtalo de nuevo.') {
    super(500, 'INTERNAL_ERROR', message);
  }
}
