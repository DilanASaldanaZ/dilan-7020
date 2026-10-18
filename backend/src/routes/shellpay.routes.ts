/**
 * Rutas de la pasarela de pagos simulada.
 */
import { Router } from 'express';
import type { ShellPayController } from '../controllers/shellpay.controller.js';
import { paymentLimiter } from '../middleware/rate-limit.js';

export function createShellPayRouter(controller: ShellPayController): Router {
  const router = Router();

  router.post('/charge', paymentLimiter, controller.charge);

  return router;
}
