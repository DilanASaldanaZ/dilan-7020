/**
 * Servicio del dashboard (frontend).
 */
import type { DashboardSummary } from '@carrera/shared';
import { apiRequest } from './api/client';

/** Descarga todo el contenido del dashboard en una sola llamada. */
export async function fetchDashboardSummary(token: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard/summary', { token });
}
