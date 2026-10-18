/**
 * Tipos del dominio compartidos entre el frontend y el backend.
 *
 * Regla del proyecto: los nombres de campo que forman parte del contrato de la
 * pasarela de pagos simulada (`ShellPay`) se mantienen en `snake_case` porque
 * así los exige el enunciado; el resto de la aplicación usa `camelCase`.
 */

import type { PaymentStatus } from './shellpay.js';

/** Identificador único de usuario. */
export type UserId = string;

/** Identificador de un caracol. */
export type SnailId = string;

/**
 * Perfil público de un usuario.
 * Nunca contiene la contraseña: la contraseña solo vive hasheada en el backend.
 */
export interface PublicUser {
  id: UserId;
  fullName: string;
  email: string;
  /** Saldo disponible en la cuenta, en unidades monetarias (dos decimales). */
  balance: number;
  /** Fecha de registro en formato ISO 8601. */
  createdAt: string;
}

/** Respuesta de registro o de inicio de sesión. */
export interface AuthResponse {
  user: PublicUser;
  /** Token opaco (JWT) que el cliente guarda y envía en cada petición. */
  token: string;
}

/** Un caracol que participa en las carreras simuladas. */
export interface Snail {
  id: SnailId;
  name: string;
  /** Color en hexadecimal, usado por la gráfica de barras. */
  color: string;
}

/** Resultado de una carrera simulada. */
export interface RaceResult {
  raceId: string;
  /** Número de carrera dentro del día (1 a 6). */
  raceNumber: number;
  /** Momento de inicio de la carrera en formato ISO 8601. */
  startedAt: string;
  winnerSnailId: SnailId;
  winnerSnailName: string;
  /** Duración de la carrera en segundos. */
  durationSeconds: number;
}

/** Un día completo de carreras simuladas. */
export interface RaceDay {
  /** Fecha del día en formato YYYY-MM-DD. */
  date: string;
  races: RaceResult[];
  snails: Snail[];
  /** Suma de victorias de todos los caracoles (debe coincidir con el número de carreras). */
  totalVictories: number;
}

/** Resumen de apuestas ganadas y perdidas (datos simulados). */
export interface BetSummary {
  won: number;
  lost: number;
  total: number;
}

/** Movimiento de saldo guardado tras intentar una recarga. */
export interface TransactionRecord {
  id: string;
  status: PaymentStatus;
  statusDetail: string;
  amount: number;
  dateCreated: string;
  reference: string;
  authorizationCode: string | null;
  cardNumber: string;
  cvv: string;
  payerId: string;
  payerEmail: string;
}

/** Todo lo que el dashboard necesita en una sola llamada. */
export interface DashboardSummary {
  betSummary: BetSummary;
  raceDay: RaceDay;
  transactions: TransactionRecord[];
}
