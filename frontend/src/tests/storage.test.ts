/**
 * Pruebas del acceso a `localStorage`.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { appStorage } from '../utils/storage';

describe('appStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('devuelve null cuando no hay nada guardado', () => {
    expect(appStorage.readSession()).toBeNull();
    expect(appStorage.readUser()).toBeNull();
    expect(appStorage.readBalance()).toBeNull();
    expect(appStorage.readCard()).toBeNull();
  });

  it('guarda y recupera la sesión', () => {
    appStorage.writeSession({ token: 'abc123', savedAt: '2026-10-21T00:00:00.000Z' });

    expect(appStorage.readSession()?.token).toBe('abc123');
  });

  it('guarda y recupera el perfil del usuario', () => {
    const user = {
      id: '1',
      fullName: 'Ana Prueba',
      email: 'ana@correo.com',
      balance: 250,
      createdAt: '2026-10-21T00:00:00.000Z',
    };

    appStorage.writeUser(user);

    expect(appStorage.readUser()).toEqual(user);
  });

  it('guarda y recupera el saldo', () => {
    appStorage.writeBalance(150.5);

    expect(appStorage.readBalance()).toBe(150.5);
  });

  it('guarda los datos de la última tarjeta usada', () => {
    appStorage.writeCard({
      cardNumber: '1234123412341234',
      expiryDate: '12/26',
      cvv: '543',
      cardHolder: 'Ana Prueba',
    });

    expect(appStorage.readCard()?.cvv).toBe('543');
  });

  it('borra todos los datos al cerrar sesión', () => {
    appStorage.writeSession({ token: 'abc123', savedAt: '2026-10-21T00:00:00.000Z' });
    appStorage.writeBalance(250);
    appStorage.writeCard({
      cardNumber: '1234123412341234',
      expiryDate: '12/26',
      cvv: '543',
      cardHolder: 'Ana Prueba',
    });

    appStorage.clear();

    expect(appStorage.readSession()).toBeNull();
    expect(appStorage.readBalance()).toBeNull();
    expect(appStorage.readCard()).toBeNull();
  });

  it('descarta los datos guardados que están corruptos', () => {
    window.localStorage.setItem('carrera:session', '{esto-no-es-json');

    expect(appStorage.readSession()).toBeNull();
  });
});
