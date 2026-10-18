/**
 * Punto de entrada del servidor.
 * Solo se encarga de encender la aplicación y apagar el servidor con Ctrl+C.
 */
import { createApp } from './app.js';
import { config, warnAboutDefaultSecret } from './config/env.js';
import { logger } from './utils/logger.js';

warnAboutDefaultSecret();

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`API escuchando en http://localhost:${config.port}/api`, {
    entorno: config.nodeEnv,
  });
});

/** Cierre ordenado del servidor. */
function shutdown(signal: string): void {
  logger.info(`Se recibió ${signal}, cerrando el servidor...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
