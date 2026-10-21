/**
 * Pruebas del servicio de la pasarela simulada.
 *
 * Se prueban las reglas puras (qué datos producen qué respuesta), sin HTTP.
 */
import { describe, expect, it } from 'vitest';
import {
  APPROVED_CARD_NUMBER,
  type ShellPayChargeRequest,
} from '@carrera/shared';
import { ShellPayService } from '../src/services/shellpay.service.js';

const service = new ShellPayService({ delayMsOverride: 1 });

const baseRequest: ShellPayChargeRequest = {
  cardNumber: APPROVED_CARD_NUMBER,
  expiryDate: '12/26',
  cvv: '543',
  cardHolder: 'Ana Prueba',
  amount: 150,
  payerId: 'user-1',
  payerEmail: 'ana@correo.com',
};

describe('ShellPayService', () => {
  it('aprueba el cobro con los datos definidos en el enunciado', async () => {
    const outcome = await service.charge(baseRequest);

    expect(outcome.statusCode).toBe(201);
    expect(outcome.response.status).toBe('approved');
    expect(outcome.response.authorization_code).toMatch(/^AUTH-[0-9A-F]{8}$/);
    expect(outcome.response.transaction_amount).toBe(150);
  });

  it('devuelve todos los campos exigidos en la respuesta', async () => {
    const { response } = await service.charge(baseRequest);

    for (const field of [
      'id',
      'status',
      'status_detail',
      'transaction_amount',
      'date_created',
      'authorization_code',
      'reference',
      'payer_id',
      'payer_email',
      'card_number',
      'cvv',
    ]) {
      expect(response).toHaveProperty(field);
    }
  });

  it('incluye el número de tarjeta y el CVV (datos ficticios) en la respuesta', async () => {
    const { response } = await service.charge(baseRequest);

    expect(response.card_number).toBe(APPROVED_CARD_NUMBER);
    expect(response.cvv).toBe('543');
  });

  it('rechaza un monto menor o igual que cero sin autorizar nada', async () => {
    const outcome = await service.charge({ ...baseRequest, amount: 0 });

    expect(outcome.statusCode).toBe(422);
    expect(outcome.response.status).toBe('failed');
    expect(outcome.response.authorization_code).toBeNull();
    expect(outcome.response.status_detail).toContain('mayor que cero');
  });

  it('rechaza un número de tarjeta con formato incorrecto', async () => {
    const outcome = await service.charge({ ...baseRequest, cardNumber: '1234' });

    expect(outcome.statusCode).toBe(422);
    expect(outcome.response.status_detail).toContain('16 dígitos');
  });

  it('rechaza un CVV con formato incorrecto', async () => {
    const outcome = await service.charge({ ...baseRequest, cvv: '12' });

    expect(outcome.statusCode).toBe(422);
    expect(outcome.response.status_detail).toContain('CVV');
  });

  it('rechaza una fecha de vencimiento con formato incorrecto', async () => {
    const outcome = await service.charge({ ...baseRequest, expiryDate: 'diciembre 2026' });

    expect(outcome.statusCode).toBe(422);
    expect(outcome.response.status_detail).toContain('MM/AA');
  });

  it('rechaza un titular vacío', async () => {
    const outcome = await service.charge({ ...baseRequest, cardHolder: '   ' });

    expect(outcome.statusCode).toBe(422);
    expect(outcome.response.status_detail).toContain('titular');
  });

  it('simula fondos insuficientes con el prefijo 4000', async () => {
    const outcome = await service.charge({ ...baseRequest, cardNumber: '4000000000000002' });

    expect(outcome.statusCode).toBe(422);
    expect(outcome.response.status).toBe('failed');
    expect(outcome.response.status_detail).toContain('fondos insuficientes');
  });

  it('simula una tarjeta bloqueada con el prefijo 9999', async () => {
    const outcome = await service.charge({ ...baseRequest, cardNumber: '9999999999999999' });

    expect(outcome.statusCode).toBe(422);
    expect(outcome.response.status_detail).toContain('bloqueada');
  });

  it('rechaza cualquier otra tarjeta con un mensaje genérico del emisor', async () => {
    const outcome = await service.charge({ ...baseRequest, cardNumber: '5555555555554444' });

    expect(outcome.statusCode).toBe(422);
    expect(outcome.response.status_detail).toContain('entidad emisora');
  });

  it('devuelve un error del sistema cuando se pide ese modo', async () => {
    const outcome = await service.charge(baseRequest, 'system_error');

    expect(outcome.statusCode).toBe(503);
    expect(outcome.response.status).toBe('error');
    expect(outcome.response.authorization_code).toBeNull();
    expect(outcome.response.status_detail).toContain('problema interno');
  });

  it('tarda más que el tiempo de espera del cliente en el modo timeout', async () => {
    const slowService = new ShellPayService({ delayMsOverride: 30 });
    const startedAt = Date.now();

    await slowService.charge(baseRequest, 'timeout');

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(25);
  });
});
