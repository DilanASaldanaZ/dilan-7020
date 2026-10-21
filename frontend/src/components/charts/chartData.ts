/**
 * Construcción de los datos de las gráficas.
 *
 * Son funciones puras: reciben datos y devuelven datos.
 * Eso permite probarlas sin montar la interfaz ni levantar un navegador.
 */
import type { BetSummary, RaceDay } from '@carrera/shared';

/** Porción de una gráfica de anillo. */
export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/** Barra de la gráfica de victorias. */
export interface SnailBar {
  /** Id del caracol. */
  id: string;
  label: string;
  victories: number;
  color: string;
}

/** Colores usados en la gráfica de apuestas. */
export const BET_COLORS = {
  won: '#34d399',
  lost: '#f87171',
} as const;

/** Convierte el resumen de apuestas en las dos porciones del anillo. */
export function buildDonutData(summary: BetSummary): DonutSlice[] {
  return [
    { label: 'Ganadas', value: Math.max(summary.won, 0), color: BET_COLORS.won },
    { label: 'Perdidas', value: Math.max(summary.lost, 0), color: BET_COLORS.lost },
  ];
}

/**
 * Cuenta las victorias de cada caracol a partir de las carreras del día.
 * La suma de las barras siempre es el número de carreras (6).
 */
export function buildSnailBarData(raceDay: RaceDay): SnailBar[] {
  const victoriesBySnail = new Map<string, number>();

  for (const race of raceDay.races) {
    victoriesBySnail.set(race.winnerSnailId, (victoriesBySnail.get(race.winnerSnailId) ?? 0) + 1);
  }

  return raceDay.snails.map((snail) => ({
    id: snail.id,
    label: snail.name,
    victories: victoriesBySnail.get(snail.id) ?? 0,
    color: snail.color,
  }));
}

/** Porcentaje de aciertos redondeado a un decimal. */
export function calculateWinRate(summary: BetSummary): number {
  if (summary.total <= 0) return 0;
  return Math.round((summary.won / summary.total) * 1000) / 10;
}
