/**
 * Controlador del dashboard.
 */
import type { Request, Response } from 'express';
import type { DashboardService } from '../services/dashboard.service.js';
import { UnauthorizedError } from '../utils/errors.js';

export function createDashboardController(dashboard: DashboardService) {
  return {
    /** GET /api/dashboard/summary */
    getSummary(req: Request, res: Response): void {
      if (!req.user) throw new UnauthorizedError();
      res.status(200).json(dashboard.getSummary(req.user.id));
    },
  };
}

/** Tipo del controlador del dashboard. */
export type DashboardController = ReturnType<typeof createDashboardController>;
