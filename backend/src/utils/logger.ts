/**
 * Logger mínimo con niveles.
 * Se evita depender de una librería externa para algo tan pequeño.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info';

function write(level: LogLevel, message: string, meta?: unknown): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] ${level.toUpperCase().padEnd(5)}`;
  const extra = meta === undefined ? '' : ` ${JSON.stringify(meta)}`;
  // eslint-disable-next-line no-console
  console.log(`${prefix} ${message}${extra}`);
}

export const logger = {
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
};
