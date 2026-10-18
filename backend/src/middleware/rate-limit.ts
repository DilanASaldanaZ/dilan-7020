/**
 * Límite de peticiones.
 *
 * Protege las rutas sensibles (registro, inicio de sesión y la pasarela
 * simulada) contra abuso. Es una medida básica de seguridad que el enunciado
 * espera ver contemplada.
 */
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

/** Límite para autenticación: evita fuerza bruta. */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
    },
  },
});

/** Límite para la pasarela simulada. */
export const paymentLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas recargas seguidas. Espera un momento antes de volver a intentarlo.',
    },
  },
});
