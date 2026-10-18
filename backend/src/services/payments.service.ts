/**
 * Servicio de recargas de saldo.
 *
 * Es el punto donde el frontend se comunica con la pasarela simulada.
 * Reglas importantes:
 *  - El saldo SOLO cambia cuando la pasarela aprueba la operación.
 *  - Toda operación (aprobada o no) queda registrada en el historial.
 *  - El monto y el pagador se toman del usuario autenticado y de los datos
 *    validados, nunca de lo que el cliente "diga" que son.
 */
import type { PaymentSimulationMode, PublicUser, ShellPayResponse, TopUpInput } from '@carrera/shared';
import { formatCurrency, validateTopUpInput } from '@carrera/shared';
import type { TransactionRepository } from '../repositories/transaction.repository.js';
import type { UserRepository } from '../repositories/user.repository.js';
import { ValidationError } from '../utils/errors.js';
import type { ShellPayService } from './shellpay.service.js';

/** Resultado de intentar una recarga. */
export interface TopUpResult {
  statusCode: number;
  payment: ShellPayResponse;
  /** Usuario con el saldo ya actualizado (solo cambia si la operación fue aprobada). */
  user: PublicUser;
}

export class PaymentService {
  constructor(
    private readonly users: UserRepository,
    private readonly transactions: TransactionRepository,
    private readonly shellPay: ShellPayService,
  ) {}

  /**
   * Procesa una recarga de saldo.
   * @param user usuario autenticado que realiza la operación.
   * @param input datos de la tarjeta y del monto.
   * @param mode modo de falla simulada de la pasarela.
   */
  async topUp(
    user: PublicUser,
    input: TopUpInput,
    mode?: PaymentSimulationMode,
  ): Promise<TopUpResult> {
    const validation = validateTopUpInput(input);
    if (!validation.valid || !validation.value) {
      throw new ValidationError('Revisa los datos de la recarga.', validation.errors);
    }

    const { cardNumber, expiryDate, cvv, cardHolder, amount } = validation.value;

    const outcome = await this.shellPay.charge(
      {
        cardNumber,
        expiryDate,
        cvv,
        cardHolder,
        amount,
        payerId: user.id,
        payerEmail: user.email,
      },
      mode,
    );

    // El saldo solo se toca cuando la pasarela aprueba la operación.
    const storedUser =
      outcome.response.status === 'approved'
        ? this.users.creditBalance(user.id, amount)
        : this.users.findById(user.id);

    this.transactions.add({
      status: outcome.response.status,
      statusDetail: outcome.response.status_detail,
      amount,
      reference: outcome.response.reference,
      authorizationCode: outcome.response.authorization_code,
      cardNumber,
      cvv,
      payerId: user.id,
      payerEmail: user.email,
    });

    return {
      statusCode: outcome.statusCode,
      payment: outcome.response,
      user: storedUser ? this.users.toPublic(storedUser) : user,
    };
  }

  /** Mensaje corto para mostrar al usuario cuando la recarga fue aprobada. */
  static successMessage(amount: number): string {
    return `Recarga aprobada por ${formatCurrency(amount)}.`;
  }
}
