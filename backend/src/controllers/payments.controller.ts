/**
 * Controlador de recargas de saldo.
 */
import type { Request, Response } from 'express';
import { PAYMENT_MODE_HEADER } from '@carrera/shared';
import type { PaymentSimulationMode } from '@carrera/shared';
import type { PaymentService } from '../services/payments.service.js';
import { UnauthorizedError } from '../utils/errors.js';

/** Lee el modo de falla simulada desde la cabecera o la query. */
export function readSimulationMode(req: Request): PaymentSimulationMode | undefined {
  const raw =
    (req.header(PAYMENT_MODE_HEADER) ?? (req.query.mode as string | undefined))?.trim().toLowerCase();

  if (raw === 'system_error' || raw === 'timeout') {
    return raw;
  }
  return undefined;
}

export function createPaymentController(payments: PaymentService) {
  return {
    /** POST /api/payments/top-up */
    async topUp(req: Request, res: Response): Promise<void> {
      if (!req.user) throw new UnauthorizedError();

      const { cardNumber, expiryDate, cvv, cardHolder, amount } = req.body ?? {};
      const result = await payments.topUp(
        req.user,
        { cardNumber, expiryDate, cvv, cardHolder, amount },
        readSimulationMode(req),
      );

      res.status(result.statusCode).json({
        payment: result.payment,
        user: result.user,
      });
    },
  };
}

/** Tipo del controlador de pagos. */
export type PaymentController = ReturnType<typeof createPaymentController>;
