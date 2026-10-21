/**
 * Pruebas de la construcción de los datos de las gráficas.
 */
import { describe, expect, it } from 'vitest';
import type { RaceDay } from '@carrera/shared';
import { buildDonutData, buildSnailBarData, calculateWinRate } from '../components/charts/chartData';

const raceDay: RaceDay = {
  date: '2026-10-21',
  totalVictories: 6,
  snails: [
    { id: 'rizo', name: 'Rizo', color: '#22c55e' },
    { id: 'espiral', name: 'Espiral', color: '#38bdf8' },
    { id: 'turbina', name: 'Turbina', color: '#f59e0b' },
  ],
  races: [
    {
      raceId: 'r1',
      raceNumber: 1,
      startedAt: '2026-10-21T10:00:00.000Z',
      winnerSnailId: 'rizo',
      winnerSnailName: 'Rizo',
      durationSeconds: 24,
    },
    {
      raceId: 'r2',
      raceNumber: 2,
      startedAt: '2026-10-21T12:00:00.000Z',
      winnerSnailId: 'rizo',
      winnerSnailName: 'Rizo',
      durationSeconds: 30,
    },
    {
      raceId: 'r3',
      raceNumber: 3,
      startedAt: '2026-10-21T14:00:00.000Z',
      winnerSnailId: 'espiral',
      winnerSnailName: 'Espiral',
      durationSeconds: 21,
    },
  ],
};

describe('buildDonutData', () => {
  it('devuelve una porción por cada tipo de apuesta', () => {
    const slices = buildDonutData({ won: 30, lost: 20, total: 50 });

    expect(slices).toHaveLength(2);
    expect(slices[0]).toMatchObject({ label: 'Ganadas', value: 30 });
    expect(slices[1]).toMatchObject({ label: 'Perdidas', value: 20 });
  });

  it('nunca devuelve valores negativos', () => {
    const slices = buildDonutData({ won: -5, lost: -3, total: 0 });

    expect(slices.every((slice) => slice.value >= 0)).toBe(true);
  });
});

describe('buildSnailBarData', () => {
  it('cuenta las victorias de cada caracol', () => {
    const bars = buildSnailBarData(raceDay);

    expect(bars).toHaveLength(3);
    expect(bars[0]).toMatchObject({ label: 'Rizo', victories: 2 });
    expect(bars[1]).toMatchObject({ label: 'Espiral', victories: 1 });
    expect(bars[2]).toMatchObject({ label: 'Turbina', victories: 0 });
  });

  it('la suma de las barras es el número de carreras', () => {
    const bars = buildSnailBarData(raceDay);
    const total = bars.reduce((acc, bar) => acc + bar.victories, 0);

    expect(total).toBe(raceDay.races.length);
  });
});

describe('calculateWinRate', () => {
  it('calcula el porcentaje de aciertos', () => {
    expect(calculateWinRate({ won: 30, lost: 20, total: 50 })).toBe(60);
  });

  it('devuelve 0 cuando no hay apuestas', () => {
    expect(calculateWinRate({ won: 0, lost: 0, total: 0 })).toBe(0);
  });
});
