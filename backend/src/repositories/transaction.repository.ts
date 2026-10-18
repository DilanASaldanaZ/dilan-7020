/**
 * Repositorio de movimientos de saldo.
 *
 * Cada intento de recarga (aprobado, rechazado o con error) queda registrado
 * para poder mostrar el historial en el dashboard y para poder auditar que
 * una recarga rechazada nunca modificó el saldo.
 */
import { randomUUID } from 'node:crypto';
import type { PaymentStatus, TransactionRecord } from '@carrera/shared';

/** Datos de un movimiento a guardar. */
export interface CreateTransactionInput {
  status: PaymentStatus;
  statusDetail: string;
  amount: number;
  reference: string;
  authorizationCode: string | null;
  cardNumber: string;
  cvv: string;
  payerId: string;
  payerEmail: string;
}

export class TransactionRepository {
  private readonly transactions: TransactionRecord[] = [];

  /** Registra un movimiento y lo devuelve. */
  add(input: CreateTransactionInput): TransactionRecord {
    const record: TransactionRecord = {
      id: randomUUID(),
      status: input.status,
      statusDetail: input.statusDetail,
      amount: input.amount,
      dateCreated: new Date().toISOString(),
      reference: input.reference,
      authorizationCode: input.authorizationCode,
      cardNumber: input.cardNumber,
      cvv: input.cvv,
      payerId: input.payerId,
      payerEmail: input.payerEmail,
    };

    this.transactions.push(record);
    return record;
  }

  /** Devuelve los movimientos de un usuario, del más reciente al más antiguo. */
  listByPayer(payerId: string, limit = 10): TransactionRecord[] {
    return this.transactions
      .filter((transaction) => transaction.payerId === payerId)
      .slice(-limit)
      .reverse();
  }
}
