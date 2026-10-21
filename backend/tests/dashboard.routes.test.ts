/**
 * Pruebas del dashboard: forma de los datos y congruencia con las reglas
 * de las carreras simuladas (6 caracoles, 6 carreras, 6 victorias).
 */
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { RACES_PER_DAY, SNAILS } from '@carrera/shared';
import { createApp } from '../src/app.js';

describe('API del dashboard', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(async () => {
    app = createApp();

    await request(app).post('/api/auth/register').send({
      fullName: 'Ana Prueba',
      email: 'ana@correo.com',
      password: 'Carrera1',
      passwordConfirmation: 'Carrera1',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@correo.com', password: 'Carrera1' });
    token = login.body.token;
  });

  it('exige una sesión activa', async () => {
    const response = await request(app).get('/api/dashboard/summary');

    expect(response.status).toBe(401);
  });

  it('devuelve el resumen de apuestas con un total coherente', async () => {
    const response = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const { betSummary } = response.body;
    expect(betSummary.won + betSummary.lost).toBe(betSummary.total);
    expect(betSummary.total).toBeGreaterThan(0);
  });

  it('devuelve el mismo resumen de apuestas en dos llamadas seguidas', async () => {
    const first = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    const second = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(second.body.betSummary).toEqual(first.body.betSummary);
  });

  it('simula 6 carreras con 6 victorias repartidas entre 6 caracoles', async () => {
    const response = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    const { raceDay } = response.body;
    expect(raceDay.snails).toHaveLength(6);
    expect(raceDay.races).toHaveLength(RACES_PER_DAY);
    expect(raceDay.totalVictories).toBe(RACES_PER_DAY);

    const winners = new Set(raceDay.races.map((race: { winnerSnailId: string }) => race.winnerSnailId));
    expect(winners.size).toBeGreaterThan(0);

    for (const snail of SNAILS) {
      expect(raceDay.snails.some((item: { id: string }) => item.id === snail.id)).toBe(true);
    }
  });

  it('numera las carreras del 1 al 6', async () => {
    const response = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    const numbers = response.body.raceDay.races.map((race: { raceNumber: number }) => race.raceNumber);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('Ruta de salud', () => {
  it('responde 200 con el estado de la API', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
