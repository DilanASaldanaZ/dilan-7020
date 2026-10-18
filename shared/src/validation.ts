/**
 * Capa de validaciones compartida.
 *
 * Se escribió a mano (en vez de usar una librería) por dos razones:
 *  1. Los mensajes de error son los mismos en el formulario (frontend) y en la
 *     API (backend), así que el usuario ve exactamente el mismo texto.
 *  2. No agrega dependencias ni magic: son funciones puras y fáciles de probar.
 */

/** Errores de validación por campo. El texto está listo para mostrarse al usuario. */
export type FieldErrors = Record<string, string>;

/** Resultado de validar una entrada: los errores y el valor ya normalizado. */
export interface ValidationResult<T> {
  valid: boolean;
  errors: FieldErrors;
  value: T | null;
}

/** Expresión regular para correos: algo@dominio.tld, sin espacios. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Longitud mínima de contraseña. */
export const PASSWORD_MIN_LENGTH = 8;

/** Longitud máxima de contraseña (evita payloads absurdamente grandes). */
export const PASSWORD_MAX_LENGTH = 72;

/** Reglas de seguridad de la contraseña, en texto legible. */
export const PASSWORD_RULES: ReadonlyArray<{ label: string; test: (value: string) => boolean }> = [
  { label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`, test: (v) => v.length >= PASSWORD_MIN_LENGTH },
  { label: 'Al menos una letra mayúscula', test: (v) => /[A-Z]/.test(v) },
  { label: 'Al menos una letra minúscula', test: (v) => /[a-z]/.test(v) },
  { label: 'Al menos un número', test: (v) => /\d/.test(v) },
];

/** Datos del formulario de registro. */
export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

/** Datos del formulario de inicio de sesión. */
export interface LoginInput {
  email: string;
  password: string;
}

/** Datos del formulario de recarga de saldo. */
export interface TopUpInput {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolder: string;
  amount: number;
}

/** Normaliza un correo: recorta espacios y lo pasa a minúsculas. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Normaliza el nombre completo: recorta espacios sobrantes de los extremos. */
export function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, ' ');
}

/** Quita todo lo que no sea dígito de una cadena (útil para tarjetas y CVV). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida un correo.
 * @returns el mensaje de error o `null` si el correo es válido.
 */
export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (value.length === 0) return 'El correo electrónico es obligatorio.';
  if (!EMAIL_PATTERN.test(value)) return 'Escribe un correo electrónico válido (ej. nombre@dominio.com).';
  return null;
}

/**
 * Valida la contraseña contra las reglas de seguridad.
 * @returns el mensaje de error o `null` si la contraseña cumple las reglas.
 */
export function validatePassword(password: string): string | null {
  if (password.length === 0) return 'La contraseña es obligatoria.';
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `La contraseña no puede superar ${PASSWORD_MAX_LENGTH} caracteres.`;
  }
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(password));
  if (failed.length > 0) {
    return `La contraseña debe cumplir: ${failed.map((rule) => rule.label.toLowerCase()).join(', ')}.`;
  }
  return null;
}

/** Devuelve las reglas de contraseña que la contraseña no cumple. */
export function getFailedPasswordRules(password: string): string[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label);
}

/** Valida el formulario de registro completo. */
export function validateRegisterInput(input: RegisterInput): ValidationResult<RegisterInput> {
  const errors: FieldErrors = {};

  const fullName = normalizeFullName(input.fullName ?? '');
  if (fullName.length === 0) {
    errors.fullName = 'El nombre completo es obligatorio.';
  } else if (fullName.length < 3) {
    errors.fullName = 'El nombre completo debe tener al menos 3 caracteres.';
  } else if (fullName.length > 80) {
    errors.fullName = 'El nombre completo no puede superar 80 caracteres.';
  }

  const emailError = validateEmail(input.email ?? '');
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password ?? '');
  if (passwordError) errors.password = passwordError;

  if ((input.passwordConfirmation ?? '').length === 0) {
    errors.passwordConfirmation = 'Confirma tu contraseña.';
  } else if (input.password !== input.passwordConfirmation) {
    errors.passwordConfirmation = 'Las contraseñas no coinciden.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      fullName,
      email: normalizeEmail(input.email ?? ''),
      password: input.password ?? '',
      passwordConfirmation: input.passwordConfirmation ?? '',
    },
  };
}

/** Valida el formulario de inicio de sesión. */
export function validateLoginInput(input: LoginInput): ValidationResult<LoginInput> {
  const errors: FieldErrors = {};

  const emailError = validateEmail(input.email ?? '');
  if (emailError) errors.email = emailError;

  if ((input.password ?? '').length === 0) {
    errors.password = 'La contraseña es obligatoria.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      email: normalizeEmail(input.email ?? ''),
      password: input.password ?? '',
    },
  };
}

/** Valida el formato del número de tarjeta (16 dígitos). */
export function validateCardNumber(cardNumber: string): string | null {
  const digits = onlyDigits(cardNumber ?? '');
  if (digits.length === 0) return 'El número de tarjeta es obligatorio.';
  if (digits.length !== 16) return 'El número de tarjeta debe tener 16 dígitos.';
  return null;
}

/** Valida el formato de la fecha de vencimiento (MM/AA). */
export function validateExpiryDate(expiryDate: string): string | null {
  const value = (expiryDate ?? '').trim();
  if (value.length === 0) return 'La fecha de vencimiento es obligatoria.';
  if (!/^\d{2}\/\d{2}$/.test(value)) return 'La fecha de vencimiento debe tener el formato MM/AA.';
  const month = Number(value.slice(0, 2));
  if (month < 1 || month > 12) return 'El mes de la fecha de vencimiento debe estar entre 01 y 12.';
  return null;
}

/** Valida el formato del CVV (3 dígitos). */
export function validateCvv(cvv: string): string | null {
  const digits = onlyDigits(cvv ?? '');
  if (digits.length === 0) return 'El CVV es obligatorio.';
  if (digits.length !== 3) return 'El CVV debe tener 3 dígitos.';
  return null;
}

/** Valida el monto de la recarga: debe ser un número mayor que cero. */
export function validateAmount(amount: number): string | null {
  if (!Number.isFinite(amount)) return 'El monto de la recarga es inválido.';
  if (amount <= 0) return 'El monto de la recarga debe ser mayor que cero.';
  if (amount > 100000) return 'El monto de la recarga no puede superar $100,000.00.';
  return null;
}

/** Valida el formulario de recarga de saldo. */
export function validateTopUpInput(input: TopUpInput): ValidationResult<TopUpInput> {
  const errors: FieldErrors = {};

  const cardNumberError = validateCardNumber(input.cardNumber ?? '');
  if (cardNumberError) errors.cardNumber = cardNumberError;

  const expiryDateError = validateExpiryDate(input.expiryDate ?? '');
  if (expiryDateError) errors.expiryDate = expiryDateError;

  const cvvError = validateCvv(input.cvv ?? '');
  if (cvvError) errors.cvv = cvvError;

  const cardHolder = (input.cardHolder ?? '').trim();
  if (cardHolder.length === 0) {
    errors.cardHolder = 'El nombre del titular de la tarjeta es obligatorio.';
  } else if (cardHolder.length > 80) {
    errors.cardHolder = 'El nombre del titular no puede superar 80 caracteres.';
  }

  const amountError = validateAmount(input.amount);
  if (amountError) errors.amount = amountError;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      cardNumber: onlyDigits(input.cardNumber ?? ''),
      expiryDate: (input.expiryDate ?? '').trim(),
      cvv: onlyDigits(input.cvv ?? ''),
      cardHolder,
      amount: Number(input.amount),
    },
  };
}
