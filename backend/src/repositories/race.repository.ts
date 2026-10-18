/**
 * Repositorio de carreras simuladas.
 *
 * Genera un día completo de carreras de forma determinista:
 * la misma fecha produce siempre las mismas carreras y el mismo ganador.
 * Así la gráfica de barras es coherente entre recargas y siempre hay
 * exactamente 6 victorias repartidas entre 6 caracoles.
 */
import { RACES_PER_DAY, SNAILS } from '@carrera/shared';
import type { RaceDay, RaceResult, Snail } from '@carrera/shared';
import { createSeededRandom, hashString, pickOne } from '../utils/random.js';

/** Convierte una fecha a `YYYY-MM-DD` en hora local. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class RaceRepository {
  /**
   * Devuelve el día de carreras simulado de la fecha indicada.
   * Las carreras empiezan a las 10:00, 12:00, 14:00, 16:00, 18:00 y 20:00.
   */
  getRaceDay(date: Date = new Date()): RaceDay {
    const dateKey = toDateKey(date);
    const random = createSeededRandom(hashString(`races:${dateKey}`));

    const races: RaceResult[] = [];
    for (let raceNumber = 1; raceNumber <= RACES_PER_DAY; raceNumber += 1) {
      const winner = pickOne(SNAILS, random);
      const hour = 10 + (raceNumber - 1) * 2;
      const startedAt = new Date(date);
      startedAt.setHours(hour, 0, 0, 0);

      races.push({
        raceId: `race-${dateKey}-${raceNumber}`,
        raceNumber,
        startedAt: startedAt.toISOString(),
        winnerSnailId: winner.id,
        winnerSnailName: winner.name,
        durationSeconds: Math.round(18 + random() * 24),
      });
    }

    const snails: Snail[] = SNAILS.map((snail) => ({ ...snail }));

    return {
      date: dateKey,
      races,
      snails,
      totalVictories: races.length,
    };
  }
}
