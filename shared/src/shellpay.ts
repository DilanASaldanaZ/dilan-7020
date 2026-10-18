/**
 * Contrato de la pasarela de pagos simulada.
 *
 * El nombre "ShellPay" es un nombre propio inventado para este simulador:
 * se eligió un nombre neutro para que el repositorio no exponga la marca
 * original del enunciado. Funciona exactamente igual que el mock pedido.
 */

/** Estado general de una operación de cobro. */
export type PaymentStatus = 'approved' | 'failed' | 'error';

/** Datos que el cliente envía para solicitar una recarga. */
export interface ShellPayChargeRequest {
  /** Número de tarjeta ficticio (16 dígitos). */
  cardNumber: string;
  /** Fecha de vencimiento en formato MM/AA. */
  expiryDate: string;
  /** CVV ficticio (3 dígitos). */
  cvv: string;
  /** Nombre completo del titular de la tarjeta. */
  cardHolder: string;
  /** Monto a recargar, mayor que cero. */
  amount: number;
  /** Identificador del usuario registrado que paga. */
  payerId: string;
  /** Correo del usuario registrado que paga. */
  payerEmail: string;
}

/**
 * Respuesta de la pasarela.
 * Incluye todos los campos exigidos por el enunciado, más el número de tarjeta
 * y el CVV (siempre ficticios) para poder reproducirlos y guardarlos.
 */
export interface ShellPayResponse {
  /** Identificador de la operación. */
  id: string;
  /** Estado general de la operación. */
  status: PaymentStatus;
  /** Detalle legible del resultado de la operación. */
  status_detail: string;
  /** Monto solicitado para la recarga. */
  transaction_amount: number;
  /** Fecha de creación de la operación en formato ISO 8601. */
  date_created: string;
  /** Código de autorización, solo cuando la operación es aprobada. */
  authorization_code: string | null;
  /** Referencia de la operación. */
  reference: string;
  /** Identificador del usuario que paga. */
  payer_id: string;
  /** Correo del usuario que paga. */
  payer_email: string;
  /** Número de tarjeta ficticio usado en la operación. */
  card_number: string;
  /** Nombre del titular de la tarjeta. */
  card_holder: string;
  /** Fecha de vencimiento de la tarjeta. */
  expiry_date: string;
  /** CVV ficticio usado en la operación. */
  cvv: string;
}

/** Tarjeta que el enunciado define como "cobro exitoso". */
export const APPROVED_CARD_NUMBER = '1234123412341234';
export const APPROVED_EXPIRY_DATE = '12/26';
export const APPROVED_CVV = '543';

/**
 * Prefijos de tarjeta que el simulador rechaza de forma controlada,
 * para poder reproducir un error de transacción sin depender de un banco real.
 */
export const DECLINED_CARD_RULES = {
  /** Prefijo que simula "fondos insuficientes". */
  insufficientFunds: '4000',
  /** Prefijo que simula "tarjeta bloqueada por el emisor". */
  blockedCard: '9999',
} as const;

/**
 * Modos de falla simulados de la pasarela.
 * Se activan con la cabecera HTTP `x-shellpay-mode`.
 */
export const PAYMENT_MODE_HEADER = 'x-shellpay-mode';
export type PaymentSimulationMode = 'system_error' | 'timeout';

/** Respuesta estándar de error de la API. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
