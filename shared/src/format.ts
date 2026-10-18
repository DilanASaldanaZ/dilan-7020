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

/** Redondea a dos decimales evitando errores de coma flotante. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
