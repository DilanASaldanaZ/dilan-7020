/**
 * Construcción de la aplicación Express.
 *
 * `app.ts` solo arma y configura la app (sin escuchar en un puerto).
 * `index.ts` es el que la enciende. Esa separación permite probar la API
 * completa con `supertest` sin levantar un servidor.
 */
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { config } from './config/env.js';
import { createAuthController } from './controllers/auth.controller.js';
import { createDashboardController } from './controllers/dashboard.controller.js';
import { createPaymentController } from './controllers/payments.controller.js';
import { createShellPayController } from './controllers/shellpay.controller.js';
import { createRequireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { RaceRepository } from './repositories/race.repository.js';
import { TransactionRepository } from './repositories/transaction.repository.js';
import { UserRepository } from './repositories/user.repository.js';
import { createApiRouter } from './routes/index.js';
import { AuthService } from './services/auth.service.js';
import { DashboardService } from './services/dashboard.service.js';
import { PaymentService } from './services/payments.service.js';
import { ShellPayService } from './services/shellpay.service.js';

export interface AppDependencies {
  /** Permite inyectar repositorios limpios en las pruebas. */
  users?: UserRepository;
  transactions?: TransactionRepository;
  races?: RaceRepository;
  shellPay?: ShellPayService;
}

export function createApp(deps: AppDependencies = {}): Express {
  const app = express();

  // 1. Cabeceras de seguridad básicas.
  app.use(helmet());

  // 2. Permitir que el frontend (que corre en otro puerto) llame a la API.
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: false,
    }),
  );

  // 3. Lectura del cuerpo de las peticiones en JSON.
  app.use(express.json({ limit: '100kb' }));

  // 4. Dependencias (repositorios y servicios).
  const users = deps.users ?? new UserRepository();
  const transactions = deps.transactions ?? new TransactionRepository();
  const races = deps.races ?? new RaceRepository();
  const shellPay = deps.shellPay ?? new ShellPayService();

  const authService = new AuthService(users);
  const paymentService = new PaymentService(users, transactions, shellPay);
  const dashboardService = new DashboardService(races, transactions);
  const requireAuth = createRequireAuth(users);

  // 5. Rutas.
  app.use(
    '/api',
    createApiRouter({
      authController: createAuthController(authService),
      paymentController: createPaymentController(paymentService),
      dashboardController: createDashboardController(dashboardService),
      shellPayController: createShellPayController(shellPay),
      requireAuth,
    }),
  );

  // 6. Ruta inexistente y manejo de errores (siempre al final).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
