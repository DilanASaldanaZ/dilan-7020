/**
 * Pruebas de registro e inicio de sesión (routers de la API).
 */
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { UserRepository } from '../src/repositories/user.repository.js';

const validPayload = {
  fullName: 'Ana Prueba',
  email: 'ana@correo.com',
  password: 'Carrera1',
  passwordConfirmation: 'Carrera1',
};

describe('API de autenticación', () => {
  let users: UserRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    users = new UserRepository();
    app = createApp({ users });
  });

  /** Registra al usuario de prueba y devuelve su token de sesión. */
  async function registerAndLogin(): Promise<string> {
    await request(app).post('/api/auth/register').send(validPayload);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: validPayload.email, password: validPayload.password });
    return login.body.token;
  }

  describe('POST /api/auth/register', () => {
    it('registra un usuario con saldo inicial de $0', async () => {
      const response = await request(app).post('/api/auth/register').send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        fullName: 'Ana Prueba',
        email: 'ana@correo.com',
        balance: 0,
      });
      expect(response.body.token).toEqual(expect.any(String));
    });

    it('nunca devuelve la contraseña ni su hash', async () => {
      const response = await request(app).post('/api/auth/register').send(validPayload);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('Carrera1');
    });

    it('guarda la contraseña hasheada', async () => {
      await request(app).post('/api/auth/register').send(validPayload);
      const stored = users.findByEmail('ana@correo.com');

      expect(stored?.passwordHash).toBeTruthy();
      expect(stored?.passwordHash).not.toBe('Carrera1');
      expect(stored?.passwordHash.startsWith('$2')).toBe(true);
    });

    it('rechaza contraseñas que no cumplen las reglas de seguridad', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, password: 'corta', passwordConfirmation: 'corta' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.password).toBeTruthy();
    });

    it('rechaza confirmaciones de contraseña que no coinciden', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, passwordConfirmation: 'Otra1' });

      expect(response.status).toBe(400);
      expect(response.body.error.details.passwordConfirmation).toBeTruthy();
    });

    it('rechaza correos con formato inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, email: 'correo-malo' });

      expect(response.status).toBe(400);
      expect(response.body.error.details.email).toBeTruthy();
    });

    it('no permite registrar dos veces el mismo correo', async () => {
      await request(app).post('/api/auth/register').send(validPayload);
      const response = await request(app).post('/api/auth/register').send(validPayload);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validPayload);
    });

    it('inicia sesión con el correo y la contraseña correctos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ana@correo.com', password: 'Carrera1' });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('ana@correo.com');
      expect(response.body.token).toEqual(expect.any(String));
    });

    it('acepta el correo en mayúsculas (se normaliza)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ANA@CORREO.COM', password: 'Carrera1' });

      expect(response.status).toBe(200);
    });

    it('rechaza una contraseña incorrecta con el mismo mensaje que un correo inexistente', async () => {
      const wrongPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ana@correo.com', password: 'Incorrecta1' });
      const unknownEmail = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nadie@correo.com', password: 'Carrera1' });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
    });
  });

  describe('GET /api/auth/me', () => {
    it('devuelve el usuario cuando el token es válido', async () => {
      const token = await registerAndLogin();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('ana@correo.com');
    });

    it('rechaza la petición sin token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rechaza un token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token.inventado');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('responde 204 y no guarda información sensible', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });
  });
});
