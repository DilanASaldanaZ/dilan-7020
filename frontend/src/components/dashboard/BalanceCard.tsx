import { formatCurrency } from '@carrera/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import './BalanceCard.css';

export interface BalanceCardProps {
  balance: number;
  /** Abre el formulario de recarga. */
  onStartTopUp: () => void;
  /** Indica si hay una recarga en curso. */
  isLoading?: boolean;
}

/** Tarjeta con el saldo disponible del usuario. */
export function BalanceCard({ balance, onStartTopUp, isLoading = false }: BalanceCardProps) {
  return (
    <Card className="cc-balance">
      <div className="cc-balance__content">
        <p className="cc-balance__label">Saldo disponible</p>
        <p className="cc-balance__amount">{formatCurrency(balance)}</p>
        <p className="cc-balance__hint">
          {balance > 0
            ? 'Tu saldo está listo para apostar en las carreras.'
            : 'Recarga saldo con la pasarela simulada para empezar a apostar.'}
        </p>
      </div>

      <Button onClick={onStartTopUp} loading={isLoading} disabled={isLoading}>
        Recargar saldo
      </Button>
    </Card>
  );
}
