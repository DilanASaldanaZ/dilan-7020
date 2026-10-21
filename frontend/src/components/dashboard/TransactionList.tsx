import type { TransactionRecord } from '@carrera/shared';
import { formatCurrency, formatDateTime, maskCardNumber } from '@carrera/shared';
import './TransactionList.css';

export interface TransactionListProps {
  transactions: TransactionRecord[];
}

const STATUS_LABELS: Record<TransactionRecord['status'], string> = {
  approved: 'Aprobada',
  failed: 'Rechazada',
  error: 'Error',
};

/** Historial de recargas del usuario. */
export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className="cc-transactions__empty">Todavía no has hecho ninguna recarga.</p>;
  }

  return (
    <ul className="cc-transactions">
      {transactions.map((transaction) => (
        <li className="cc-transactions__item" key={transaction.id}>
          <div className="cc-transactions__head">
            <span className={`cc-transactions__status cc-transactions__status--${transaction.status}`}>
              {STATUS_LABELS[transaction.status]}
            </span>
            <span className="cc-transactions__amount">{formatCurrency(transaction.amount)}</span>
          </div>

          <p className="cc-transactions__detail">{transaction.statusDetail}</p>

          <p className="cc-transactions__meta">
            {formatDateTime(transaction.dateCreated)} · {maskCardNumber(transaction.cardNumber)} · Ref.{' '}
            {transaction.reference}
          </p>
        </li>
      ))}
    </ul>
  );
}
