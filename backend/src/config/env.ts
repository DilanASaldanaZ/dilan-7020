/**
 * Configuración de la aplicación.
 *
 * Los valores llegan por variables de entorno con un valor por defecto
 * razonable para desarrollo, así el proyecto se levanta sin configurar nada.
 */
import process from 'node:process';

/** Lee el archivo `.env` si existe. No falla si no está. */
function loadDotEnv(): void {
  try {
    process.loadEnvFile('.env');
  } catch {
    // No hay archivo .env: se usan los valores por defecto.
  }
}

loadDotEnv();

export type NodeEnvironment = 'development' | 'test' | 'production';

export interface AppConfig {
  nodeEnv: NodeEnvironment;
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  /** Orígenes permitidos por CORS. */
  corsOrigins: string[];
  /** Retraso (ms) que usa el simulador para el escenario de timeout. */
  shellpayTimeoutDelayMs: number;
}

const nodeEnv = (process.env.NODE_ENV ?? 'development') as NodeEnvironment;

const DEFAULT_JWT_SECRET = 'secreto-de-desarrollo-no-usar-en-produccion';

export const config: AppConfig = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  shellpayTimeoutDelayMs: Number(process.env.SHELLPAY_TIMEOUT_DELAY_MS ?? 15_000),
};

/** Avisa en consola cuando se usa el secreto por defecto. */
export function warnAboutDefaultSecret(): void {
  if (config.jwtSecret === DEFAULT_JWT_SECRET && config.nodeEnv !== 'test') {
    console.warn(
      '[config] Estás usando el secreto JWT por defecto. Define JWT_SECRET antes de desplegar.',
    );
  }
}
