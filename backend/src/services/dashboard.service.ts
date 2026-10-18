/**
 * Servicio del dashboard.
 *
 * Arma en una sola respuesta todo lo que el dashboard necesita:
 *  - Resumen de apuestas ganadas y perdidas (datos simulados).
 *  - El día de carreras simulado (6 caracoles, 6 carreras, 6 victorias).
 *  - Los últimos movimientos de saldo del usuario.
 */
import type { BetSummary, DashboardSummary } from '@carrera/shared';
import type { RaceRepository } from '../repositories/race.repository.js';
import type { TransactionRepository } from '../repositories/transaction.repository.js';
import { createSeededRandom, hashString } from '../utils/random.js';

export class DashboardService {
  constructor(
    private readonly races: RaceRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  /**
   * Genera el resumen de apuestas del usuario.
   * Es determinista: el mismo usuario ve siempre los mismos números.
   */
  private buildBetSummary(userId: string): BetSummary {
    const random = createSeededRandom(hashString(`bets:${userId}`));
    const total = 45 + Math.floor(random() * 16); // Entre 45 y 60 apuestas.
    const winRate = 0.5 + random() * 0.2; // Entre 50 % y 70 % de aciertos.
    const won = Math.round(total * winRate);

    return { won, lost: total - won, total };
  }

  /** Devuelve todo el contenido del dashboard para un usuario. */
  getSummary(userId: string): DashboardSummary {
    return {
      betSummary: this.buildBetSummary(userId),
      raceDay: this.races.getRaceDay(),
      transactions: this.transactions.listByPayer(userId),
    };
  }
}
