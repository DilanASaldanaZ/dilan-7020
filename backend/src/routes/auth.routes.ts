/**
 * Rutas de autenticación.
 */
import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { AuthController } from '../controllers/auth.controller.js';
import { authLimiter } from '../middleware/rate-limit.js';

export function createAuthRouter(
  controller: AuthController,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.post('/register', authLimiter, controller.register);
  router.post('/login', authLimiter, controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth, controller.me);

  return router;
}
