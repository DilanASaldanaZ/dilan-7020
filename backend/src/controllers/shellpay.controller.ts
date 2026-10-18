/**
 * Controlador de la pasarela simulada expuesta directamente.
 *
 * Esta ruta NO requiere sesión a propósito: sirve para que cualquiera pueda
 * reproducir por su cuenta cada respuesta de la pasarela (caso de éxito,
 * error de transacción y error del sistema) sin crear un usuario.
 * Es un simulador: no mueve dinero real.
 */
import type { Request, Response } from 'express';
import type { ShellPayService } from '../services/shellpay.service.js';
import { readSimulationMode } from './payments.controller.js';
import { ValidationError } from '../utils/errors.js';

export function createShellPayController(shellPay: ShellPayService) {
  return {
    /** POST /api/shellpay/charge */
    async charge(req: Request, res: Response): Promise<void> {
      const { cardNumber, expiryDate, cvv, cardHolder, amount, payerId, payerEmail } =
        req.body ?? {};

      if (!payerId || !payerEmail) {
        throw new ValidationError(
          'Indica `payerId` y `payerEmail` para poder reproducir la operación.',
        );
      }

      const outcome = await shellPay.charge(
        {
          cardNumber: String(cardNumber ?? ''),
          expiryDate: String(expiryDate ?? ''),
          cvv: String(cvv ?? ''),
          cardHolder: String(cardHolder ?? ''),
          amount: Number(amount),
          payerId: String(payerId),
          payerEmail: String(payerEmail),
        },
        readSimulationMode(req),
      );

      res.status(outcome.statusCode).json(outcome.response);
    },
  };
}

/** Tipo del controlador de la pasarela simulada. */
export type ShellPayController = ReturnType<typeof createShellPayController>;
