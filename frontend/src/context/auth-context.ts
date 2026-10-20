/**
 * Contexto de autenticación.
 *
 * Define el contrato (qué expone el contexto) sin implementarlo, para que
 * los componentes no dependan del archivo del provider.
 */
import { createContext } from 'react';
import type { PublicUser } from '@carrera/shared';

/** Estado de la sesión. */
export type AuthStatus =
  /** Se está comprobando si hay una sesión guardada. */
  | 'loading'
  /** Hay una sesión activa. */
  | 'authenticated'
  /** No hay sesión: el usuario es anónimo. */
  | 'anonymous';

/** Valores que expone el contexto de autenticación. */
export interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  token: string | null;
  /** Inicia sesión con correo y contraseña. */
  login(email: string, password: string): Promise<void>;
  /** Registra un usuario nuevo e inicia sesión. */
  register(payload: {
    fullName: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<void>;
  /** Cierra la sesión y borra los datos guardados en el navegador. */
  logout(): Promise<void>;
  /** Actualiza el saldo en el estado y lo guarda en `localStorage`. */
  updateBalance(balance: number): void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
