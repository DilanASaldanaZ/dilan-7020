/**
 * Ensamblado de las rutas de la API.
 */
import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { AuthController } from '../controllers/auth.controller.js';
import type { DashboardController } from '../controllers/dashboard.controller.js';
import type { PaymentController } from '../controllers/payments.controller.js';
import type { ShellPayController } from '../controllers/shellpay.controller.js';
import { createAuthRouter } from './auth.routes.js';
import { createDashboardRouter } from './dashboard.routes.js';
import { createPaymentsRouter } from './payments.routes.js';
import { createShellPayRouter } from './shellpay.routes.js';

export interface RouterDependencies {
  authController: AuthController;
  paymentController: PaymentController;
  dashboardController: DashboardController;
  shellPayController: ShellPayController;
  requireAuth: RequestHandler;
}

export function createApiRouter(deps: RouterDependencies): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'carrera-caracoles-api' });
  });

  router.use('/auth', createAuthRouter(deps.authController, deps.requireAuth));
  router.use('/payments', createPaymentsRouter(deps.paymentController, deps.requireAuth));
  router.use('/dashboard', createDashboardRouter(deps.dashboardController, deps.requireAuth));
  router.use('/shellpay', createShellPayRouter(deps.shellPayController));

  return router;
}
