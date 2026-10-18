/**
 * Rutas de recargas de saldo.
 */
import { Router } from 'express';
import type { PaymentController } from '../controllers/payments.controller.js';
import { paymentLimiter } from '../middleware/rate-limit.js';
import type { RequestHandler } from 'express';

export function createPaymentsRouter(controller: PaymentController, requireAuth: RequestHandler): Router {
  const router = Router();

  router.post('/top-up', paymentLimiter, requireAuth, controller.topUp);

  return router;
}
