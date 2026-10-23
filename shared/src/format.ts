/**
 * Utilidades de formato compartidas.
 * Se usan igual en el backend (mensajes) y en el frontend (vista).
 */

/**
 * Formatea un monto como moneda.
 * @example formatCurrency(1234.5) // "$1,234.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/** Formatea una fecha ISO como `dd/mm/aaaa hh:mm`. */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Oculta todos los dígitos del número de tarjeta salvo los últimos cuatro.
 * @example maskCardNumber('1234123412341234') // '•••• •••• •••• 1234'
 */
export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

/**
 * Da formato progresivo al campo de vencimiento de la tarjeta (MM/AA).
 *
 * - Descarta cualquier carácter que no sea un dígito.
 * - Inserta la diagonal automáticamente al escribir el segundo dígito.
 * - Limita el año a dos dígitos (4 dígitos en total).
 *
 * `previousValue` permite detectar cuando el usuario borra la diagonal y, en
 * ese caso, eliminar también el último dígito del mes para que el borrado no
 * quede atrapado en "12/".
 *
 * @example formatExpiryDateInput('12') // '12/'
 * @example formatExpiryDateInput('1226') // '12/26'
 * @example formatExpiryDateInput('1a2b', '') // '12/'
 */
export function formatExpiryDateInput(value: string, previousValue = ''): string {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 4);
  const deletingSlash = previousValue.endsWith('/') && value.length < previousValue.length;

  if (deletingSlash && digits.length === 2) {
    return digits.slice(0, -1);
  }

  if (digits.length < 2) return digits;

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/**
 * Da formato al campo de CVV: solo dígitos y un máximo de tres.
 * @example formatCvvInput('5a43') // '543'
 * @example formatCvvInput('54321') // '543'
 */
export function formatCvvInput(value: string): string {
  return (value ?? '').replace(/\D/g, '').slice(0, 3);
}

/** Redondea a dos decimales evitando errores de coma flotante. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
