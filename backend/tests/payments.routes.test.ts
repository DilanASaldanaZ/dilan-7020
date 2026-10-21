/**
 * Pruebas del flujo de recarga de saldo y su efecto sobre el saldo del usuario.
 */
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { APPROVED_CARD_NUMBER } from '@carrera/shared';
import { createApp } from '../src/app.js';
import { UserRepository } from '../src/repositories/user.repository.js';

const credentials = { email: 'ana@correo.com', password: 'Carrera1' };

const approvedCard = {
  cardNumber: APPROVED_CARD_NUMBER,
  expiryDate: '12/26',
  cvv: '543',
  cardHolder: 'Ana Prueba',
  amount: 250,
};

describe('API de recargas de saldo', () => {
  let users: UserRepository;
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(async () => {
    users = new UserRepository();
    app = createApp({ users });

    await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, fullName: 'Ana Prueba', passwordConfirmation: credentials.password });

    const login = await request(app).post('/api/auth/login').send(credentials);
    token = login.body.token;
  });

  it('exige una sesión activa', async () => {
    const response = await request(app).post('/api/payments/top-up').send(approvedCard);

    expect(response.status).toBe(401);
  });

  it('aprueba la recarga y suma el monto al saldo', async () => {
    const response = await request(app)
      .post('/api/payments/top-up')
      .set('Authorization', `Bearer ${token}`)
      .send(approvedCard);

    expect(response.status).toBe(201);
    expect(response.body.payment.status).toBe('approved');
    expect(response.body.payment.authorization_code).toBeTruthy();
    expect(response.body.user.balance).toBe(250);
    expect(users.findByEmail('ana@correo.com')?.balance).toBe(250);
  });

  it('acumula varias recargas en el saldo', async () => {
    await request(app)
      .post('/api/payments/top-up')
      .set('Authorization', `Bearer ${token}`)
      .send(approvedCard);

    const response = await request(app)
      .post('/api/payments/top-up')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...approvedCard, amount: 100 });

    expect(response.body.user.balance).toBe(350);
  });

  it('no modifica el saldo cuando la tarjeta es rechazada', async () => {
    const response = await request(app)
      .post('/api/payments/top-up')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...approvedCard, cardNumber: '4000000000000002' });

    expect(response.status).toBe(422);
    expect(response.body.payment.status).toBe('failed');
    expect(response.body.payment.authorization_code).toBeNull();
    expect(response.body.payment.status_detail).toContain('fondos insuficientes');
    expect(response.body.user.balance).toBe(0);
    expect(users.findByEmail('ana@correo.com')?.balance).toBe(0);
  });

  it('no modifica el saldo cuando la pasarela tiene un error interno', async () => {
    const response = await request(app)
      .post('/api/payments/top-up')
      .set('Authorization', `Bearer ${token}`)
      .set('x-shellpay-mode', 'system_error')
      .send(approvedCard);

    expect(response.status).toBe(503);
    expect(response.body.payment.status).toBe('error');
    expect(response.body.user.balance).toBe(0);
    expect(users.findByEmail('ana@correo.com')?.balance).toBe(0);
  });

  it('no genera un falso cobro exitoso con datos inválidos', async () => {
    const response = await request(app)
      .post('/api/payments/top-up')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...approvedCard, amount: -50 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(users.findByEmail('ana@correo.com')?.balance).toBe(0);
  });

  it('registra la recarga en el historial del dashboard', async () => {
    await request(app)
      .post('/api/payments/top-up')
      .set('Authorization', `Bearer ${token}`)
      .send(approvedCard);

    const response = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toHaveLength(1);
    expect(response.body.transactions[0]).toMatchObject({ status: 'approved', amount: 250 });
  });
});

describe('API directa de la pasarela simulada', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('permite reproducir el cobro exitoso sin necesidad de sesión', async () => {
    const response = await request(app).post('/api/shellpay/charge').send({
      ...approvedCard,
      payerId: 'user-demo',
      payerEmail: 'demo@correo.com',
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('approved');
    expect(response.body.payer_id).toBe('user-demo');
    expect(response.body.payer_email).toBe('demo@correo.com');
  });

  it('permite reproducir el error de transacción', async () => {
    const response = await request(app).post('/api/shellpay/charge').send({
      ...approvedCard,
      cardNumber: '4000000000000002',
      payerId: 'user-demo',
      payerEmail: 'demo@correo.com',
    });

    expect(response.status).toBe(422);
    expect(response.body.status).toBe('failed');
  });

  it('permite reproducir el error del sistema con la cabecera documentada', async () => {
    const response = await request(app)
      .post('/api/shellpay/charge')
      .set('x-shellpay-mode', 'system_error')
      .send({
        ...approvedCard,
        payerId: 'user-demo',
        payerEmail: 'demo@correo.com',
      });

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
  });

  it('exige el identificador y el correo del pagador', async () => {
    const response = await request(app).post('/api/shellpay/charge').send(approvedCard);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
