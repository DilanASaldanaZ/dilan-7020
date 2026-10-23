import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatCurrency, formatCvvInput, formatExpiryDateInput, validateTopUpInput } from '@carrera/shared';
import type { FieldErrors } from '@carrera/shared';
import { ApiError } from '../../services/api/client';
import { extractPaymentFromError, topUp } from '../../services/payments.service';
import { appStorage } from '../../utils/storage';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TextField } from '../ui/TextField';
import './TopUpForm.css';

export interface TopUpFormProps {
  /** Token de la sesión activa. */
  token: string;
  /** Nombre completo del usuario (se usa como titular por defecto). */
  defaultCardHolder: string;
  /** Se llama cuando la recarga fue aprobada. */
  onApproved: (balance: number) => void;
}

/**
 * Formulario de recarga de saldo mediante la pasarela simulada.
 *
 * Muestra el detalle exacto que devuelve la pasarela en cada escenario
 * (aprobado, error de transacción o error del sistema).
 */
export function TopUpForm({ token, defaultCardHolder, onApproved }: TopUpFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(defaultCardHolder);
  const [amount, setAmount] = useState('');
  const [simulateSystemError, setSimulateSystemError] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const numericAmount = Number(amount);
    const validation = validateTopUpInput({
      cardNumber,
      expiryDate,
      cvv,
      cardHolder,
      amount: Number.isFinite(numericAmount) ? numericAmount : Number.NaN,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await topUp(
        {
          cardNumber: validation.value!.cardNumber,
          expiryDate: validation.value!.expiryDate,
          cvv: validation.value!.cvv,
          cardHolder: validation.value!.cardHolder,
          amount: validation.value!.amount,
        },
        token,
        { simulateSystemError },
      );

      // El enunciado pide guardar el número de tarjeta y el CVV en
      // localStorage. Son datos ficticios de una pasarela simulada.
      appStorage.writeCard({
        cardNumber: validation.value!.cardNumber,
        expiryDate: validation.value!.expiryDate,
        cvv: validation.value!.cvv,
        cardHolder: validation.value!.cardHolder,
      });

      setSuccessMessage(result.payment.status_detail);
      onApproved(result.user.balance);
      setAmount('');
    } catch (error) {
      const payment = extractPaymentFromError(error);

      if (payment) {
        setFormError(payment.status_detail);
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('No pudimos completar la recarga. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      title="Recargar saldo"
      subtitle="Pasarela de pagos simulada (ShellPay). Usa datos ficticios."
      className="cc-topup"
    >
      <form className="cc-topup__form" onSubmit={handleSubmit} noValidate>
        <div className="cc-topup__grid">
          <TextField
            label="Número de tarjeta"
            placeholder="1234123412341234"
            inputMode="numeric"
            autoComplete="off"
            value={cardNumber}
            onChange={(event) => setCardNumber(event.target.value)}
            error={fieldErrors.cardNumber}
            hint="Tarjeta de prueba: 1234123412341234"
          />

          <div className="cc-topup__row">
            <TextField
              label="Vencimiento"
              placeholder="MM/AA"
              inputMode="numeric"
              maxLength={5}
              autoComplete="off"
              value={expiryDate}
              onChange={(event) =>
                setExpiryDate(formatExpiryDateInput(event.target.value, expiryDate))
              }
              error={fieldErrors.expiryDate}
              hint="12/26"
            />

            <TextField
              label="CVV"
              placeholder="123"
              inputMode="numeric"
              maxLength={3}
              autoComplete="off"
              value={cvv}
              onChange={(event) => setCvv(formatCvvInput(event.target.value))}
              error={fieldErrors.cvv}
              hint="543"
            />
          </div>

          <TextField
            label="Nombre completo del titular"
            autoComplete="off"
            value={cardHolder}
            onChange={(event) => setCardHolder(event.target.value)}
            error={fieldErrors.cardHolder}
          />

          <TextField
            label="Monto de la recarga"
            type="number"
            min="1"
            step="0.01"
            placeholder="250.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={fieldErrors.amount}
            hint={
              amount && Number(amount) > 0 ? `Vas a recargar ${formatCurrency(Number(amount))}` : undefined
            }
          />
        </div>

        <label className="cc-topup__checkbox">
          <input
            type="checkbox"
            checked={simulateSystemError}
            onChange={(event) => setSimulateSystemError(event.target.checked)}
          />
          <span>Simular un error interno de la pasarela</span>
        </label>

        {formError ? <Alert variant="error" title="No se pudo completar la recarga">{formError}</Alert> : null}

        {successMessage ? (
          <Alert variant="success" title="Recarga aprobada">
            {successMessage}
          </Alert>
        ) : null}

        <Button type="submit" loading={isSubmitting} disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Procesando…' : 'Confirmar recarga'}
        </Button>
      </form>
    </Card>
  );
}
