import type { PublicUser } from '@carrera/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Usuario autenticado. Lo agrega el middleware `requireAuth`. */
      user?: PublicUser;
    }
  }
}

export {};
