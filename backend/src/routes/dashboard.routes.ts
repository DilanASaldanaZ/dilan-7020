/**
 * Rutas del dashboard.
 */
import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { DashboardController } from '../controllers/dashboard.controller.js';

export function createDashboardRouter(
  controller: DashboardController,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.get('/summary', requireAuth, controller.getSummary);

  return router;
}
