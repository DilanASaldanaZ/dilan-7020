/**
 * Pruebas de los repositorios (la "base de datos" en memoria).
 */
import { describe, expect, it } from 'vitest';
import { RaceRepository } from '../src/repositories/race.repository.js';
import { UserRepository } from '../src/repositories/user.repository.js';

describe('UserRepository', () => {
  it('crea un usuario con saldo inicial de $0', () => {
    const repository = new UserRepository();
    const user = repository.create({
      fullName: 'Ana Prueba',
      email: 'ana@correo.com',
      passwordHash: 'hash',
    });

    expect(user.balance).toBe(0);
    expect(repository.count()).toBe(1);
  });

  it('busca por correo normalizado', () => {
    const repository = new UserRepository();
    repository.create({ fullName: 'Ana', email: 'ana@correo.com', passwordHash: 'hash' });

    expect(repository.findByEmail('ANA@correo.com')).toBeDefined();
    expect(repository.findByEmail('otro@correo.com')).toBeUndefined();
  });

  it('acredita saldo de forma acumulativa', () => {
    const repository = new UserRepository();
    const user = repository.create({ fullName: 'Ana', email: 'ana@correo.com', passwordHash: 'hash' });

    repository.creditBalance(user.id, 150);
    repository.creditBalance(user.id, 100.5);

    expect(repository.findById(user.id)?.balance).toBe(250.5);
  });

  it('no permite acreditar montos no positivos', () => {
    const repository = new UserRepository();
    const user = repository.create({ fullName: 'Ana', email: 'ana@correo.com', passwordHash: 'hash' });

    expect(() => repository.creditBalance(user.id, 0)).toThrowError();
    expect(() => repository.creditBalance(user.id, -10)).toThrowError();
  });

  it('nunca expone el hash de la contraseña en la versión pública', () => {
    const repository = new UserRepository();
    const user = repository.create({ fullName: 'Ana', email: 'ana@correo.com', passwordHash: 'hash' });

    expect(repository.toPublic(user)).not.toHaveProperty('passwordHash');
  });
});

describe('RaceRepository', () => {
  it('genera el mismo día de carreras para la misma fecha', () => {
    const repository = new RaceRepository();
    const date = new Date('2026-10-21T12:00:00');

    const first = repository.getRaceDay(date);
    const second = repository.getRaceDay(date);

    expect(first).toEqual(second);
  });

  it('genera carreras diferentes para fechas diferentes', () => {
    const repository = new RaceRepository();

    const first = repository.getRaceDay(new Date('2026-10-21T12:00:00'));
    const second = repository.getRaceDay(new Date('2026-10-22T12:00:00'));

    expect(first.date).not.toBe(second.date);
  });

  it('siempre tiene 6 carreras y 6 victorias', () => {
    const repository = new RaceRepository();
    const day = repository.getRaceDay(new Date('2026-10-21T12:00:00'));

    expect(day.races).toHaveLength(6);
    expect(day.totalVictories).toBe(6);
  });
});
