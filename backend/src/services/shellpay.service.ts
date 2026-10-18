/**
 * Servicio de la pasarela de pagos simulada (`ShellPay`).
 *
 * Es un mock: NO se conecta a ningún servicio real, NO procesa información
 * financiera real y NO mueve dinero. Solo decide, de forma determinista y
 * documentada, si una operación se aprueba, se rechaza o falla.
 *
 * Reglas (todas reproducibles):
 *
 * 1. Si llega el modo `system_error`, la pasarela responde con error interno
 *    (HTTP 503). No se aprueba nada y el saldo no se toca.
 * 2. Si llega el modo `timeout`, la pasarela tarda más que el tiempo de espera
 *    del cliente, para poder reproducir un timeout.
 * 3. Si falta un dato o el formato es incorrecto, la operación se rechaza con
 *    un mensaje explicativo (HTTP 422).
 * 4. Si la tarjeta es `1234123412341234`, la operación se aprueba (HTTP 201).
 * 5. Si la tarjeta empieza con `4000`, se rechaza por fondos insuficientes.
 * 6. Si la tarjeta empieza con `9999`, se rechaza como tarjeta bloqueada.
 * 7. Cualquier otra tarjeta se rechaza por decisión del emisor.
 */
import { randomUUID } from 'node:crypto';
import {
  APPROVED_CARD_NUMBER,
  DECLINED_CARD_RULES,
  formatCurrency,
} from '@carrera/shared';
import type { PaymentSimulationMode, ShellPayChargeRequest, ShellPayResponse } from '@carrera/shared';
import { config } from '../config/env.js';

/** Resultado interno del simulador: la respuesta y el código HTTP a devolver. */
export interface ShellPayOutcome {
  statusCode: number;
  response: ShellPayResponse;
}

export class ShellPayService {
  /**
   * @param options.delayMsOverride Milisegundos extra de espera (lo usan las pruebas).
   */
  constructor(private readonly options: { delayMsOverride?: number } = {}) {}

  /** Genera el identificador y la referencia de la operación. */
  private buildOperationIds(): { id: string; reference: string } {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return { id: `sp_${suffix.toLowerCase()}`, reference: `SP-${day}-${suffix}` };
  }

  /** Construye la respuesta con todos los campos del contrato. */
  private buildResponse(
    request: ShellPayChargeRequest,
    status: ShellPayResponse['status'],
    statusDetail: string,
    authorizationCode: string | null,
  ): ShellPayResponse {
    const { id, reference } = this.buildOperationIds();

    return {
      id,
      status,
      status_detail: statusDetail,
      transaction_amount: request.amount,
      date_created: new Date().toISOString(),
      authorization_code: authorizationCode,
      reference,
      payer_id: request.payerId,
      payer_email: request.payerEmail,
      card_number: request.cardNumber,
      card_holder: request.cardHolder,
      expiry_date: request.expiryDate,
      cvv: request.cvv,
    };
  }

  /**
   * Valida los datos de la operación.
   * @returns el mensaje de error o `null` si todo está correcto.
   */
  private validate(request: ShellPayChargeRequest): string | null {
    const cardDigits = request.cardNumber.replace(/\D/g, '');
    const cvvDigits = request.cvv.replace(/\D/g, '');

    if (!request.cardHolder || request.cardHolder.trim().length === 0) {
      return 'El nombre del titular de la tarjeta es obligatorio.';
    }
    if (!request.payerId || !request.payerEmail) {
      return 'No se recibió el identificador del usuario que realiza la recarga.';
    }
    if (!Number.isFinite(request.amount) || request.amount <= 0) {
      return 'El monto de la recarga es inválido. Debe ser mayor que cero.';
    }
    if (cardDigits.length !== 16) {
      return 'El número de tarjeta no tiene un formato válido. Debe contener 16 dígitos.';
    }
    if (cvvDigits.length !== 3) {
      return 'El CVV es inválido. Debe contener 3 dígitos.';
    }
    if (!/^\d{2}\/\d{2}$/.test(request.expiryDate.trim())) {
      return 'La fecha de vencimiento es inválida. Usa el formato MM/AA.';
    }
    return null;
  }

  /**
   * Procesa una solicitud de recarga.
   * @param request datos de la recarga.
   * @param mode modo de falla simulada (opcional).
   */
  async charge(
    request: ShellPayChargeRequest,
    mode?: PaymentSimulationMode,
  ): Promise<ShellPayOutcome> {
    if (mode === 'timeout') {
      const delay = this.options.delayMsOverride ?? config.shellpayTimeoutDelayMs;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // 1. Error interno de la pasarela.
    if (mode === 'system_error') {
      return {
        statusCode: 503,
        response: this.buildResponse(
          request,
          'error',
          'La pasarela de pagos está teniendo un problema interno y no pudo procesar la solicitud. No se realizó ningún cargo. Inténtalo de nuevo más tarde.',
          null,
        ),
      };
    }

    // 2. Datos inválidos.
    const validationError = this.validate(request);
    if (validationError) {
      return {
        statusCode: 422,
        response: this.buildResponse(request, 'failed', validationError, null),
      };
    }

    // 3. Cobro aprobado.
    if (request.cardNumber === APPROVED_CARD_NUMBER) {
      const authorizationCode = `AUTH-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
      return {
        statusCode: 201,
        response: this.buildResponse(
          request,
          'approved',
          `Pago aprobado. Se acreditaron ${formatCurrency(request.amount)} a tu cuenta.`,
          authorizationCode,
        ),
      };
    }

    // 4. Tarjeta rechazada por fondos insuficientes.
    if (request.cardNumber.startsWith(DECLINED_CARD_RULES.insufficientFunds)) {
      return {
        statusCode: 422,
        response: this.buildResponse(
          request,
          'failed',
          'La tarjeta fue rechazada por la entidad emisora: la cuenta no tiene fondos insuficientes para la operación. No se realizó ningún cargo.',
          null,
        ),
      };
    }

    // 5. Tarjeta bloqueada.
    if (request.cardNumber.startsWith(DECLINED_CARD_RULES.blockedCard)) {
      return {
        statusCode: 422,
        response: this.buildResponse(
          request,
          'failed',
          'La tarjeta fue rechazada por la entidad emisora: la tarjeta aparece bloqueada. No se realizó ningún cargo.',
          null,
        ),
      };
    }

    // 6. Rechazo genérico del emisor.
    return {
      statusCode: 422,
      response: this.buildResponse(
        request,
        'failed',
        'La entidad emisora rechazó la operación. No se realizó ningún cargo.',
        null,
      ),
    };
  }
}
