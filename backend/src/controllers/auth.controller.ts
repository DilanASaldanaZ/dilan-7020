/**
 * Controladores de autenticación.
 * Reciben la petición, delegan en el servicio y envían la respuesta.
 */
import type { Request, Response } from 'express';
import type { AuthService } from '../services/auth.service.js';
import { UnauthorizedError } from '../utils/errors.js';

export function createAuthController(auth: AuthService) {
  return {
    /** POST /api/auth/register */
    async register(req: Request, res: Response): Promise<void> {
      const { fullName, email, password, passwordConfirmation } = req.body ?? {};
      const result = await auth.register({
        fullName,
        email,
        password,
        passwordConfirmation,
      });
      res.status(201).json(result);
    },

    /** POST /api/auth/login */
    async login(req: Request, res: Response): Promise<void> {
      const { email, password } = req.body ?? {};
      const result = await auth.login({ email, password });
      res.status(200).json(result);
    },

    /**
     * POST /api/auth/logout
     *
     * El token es sin estado (JWT): no hay lista de tokens que revocar en el
     * servidor. Cerrar sesión consiste en que el cliente borre el token y los
     * datos guardados en localStorage. La ruta existe para que el flujo sea
     * explícito y quede registrado en los logs de la API.
     */
    logout(_req: Request, res: Response): void {
      res.status(204).send();
    },

    /** GET /api/auth/me */
    me(req: Request, res: Response): void {
      if (!req.user) throw new UnauthorizedError();
      res.status(200).json({ user: req.user });
    },
  };
}

/** Tipo del controlador de autenticación. */
export type AuthController = ReturnType<typeof createAuthController>;
