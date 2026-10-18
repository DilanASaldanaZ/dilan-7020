/**
 * Pruebas de la capa de validaciones compartida.
 *
 * Estas reglas son las que protegen tanto el formulario como la API,
 * por eso se prueban una sola vez y en un solo lugar.
 */
import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  maskCardNumber,
  normalizeEmail,
  roundMoney,
  validateAmount,
  validateCardNumber,
  validateCvv,
  validateEmail,
  validateExpiryDate,
  validateLoginInput,
  validatePassword,
  validateRegisterInput,
  validateTopUpInput,
} from '../src/index.js';

describe('validateEmail', () => {
  it('acepta un correo bien escrito', () => {
    expect(validateEmail('ana@correo.com')).toBeNull();
  });

  it('rechaza un correo sin arroba', () => {
    expect(validateEmail('ana.correo.com')).toBeTruthy();
  });

  it('rechaza un correo sin dominio', () => {
    expect(validateEmail('ana@')).toBeTruthy();
  });

  it('rechaza un correo vacío', () => {
    expect(validateEmail('   ')).toBeTruthy();
  });
});

describe('validatePassword', () => {
  it('acepta una contraseña con mayúscula, minúscula, número y 8 caracteres', () => {
    expect(validatePassword('Carrera1')).toBeNull();
  });

  it('rechaza una contraseña demasiado corta', () => {
    expect(validatePassword('Ca1')).toBeTruthy();
  });

  it('rechaza una contraseña sin mayúscula', () => {
    expect(validatePassword('carrera1')).toBeTruthy();
  });

  it('rechaza una contraseña sin número', () => {
    expect(validatePassword('CarreraCaracol')).toBeTruthy();
  });
});

describe('validateRegisterInput', () => {
  it('acepta un registro válido y normaliza el correo', () => {
    const result = validateRegisterInput({
      fullName: '  Ana   Prueba ',
      email: ' ANA@Correo.com ',
      password: 'Carrera1',
      passwordConfirmation: 'Carrera1',
    });

    expect(result.valid).toBe(true);
    expect(result.value?.email).toBe('ana@correo.com');
    expect(result.value?.fullName).toBe('Ana Prueba');
  });

  it('señala que las contraseñas no coinciden', () => {
    const result = validateRegisterInput({
      fullName: 'Ana Prueba',
      email: 'ana@correo.com',
      password: 'Carrera1',
      passwordConfirmation: 'Carrera2',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.passwordConfirmation).toBe('Las contraseñas no coinciden.');
  });

  it('acumula los errores de varios campos', () => {
    const result = validateRegisterInput({
      fullName: '',
      email: 'mal',
      password: 'corta',
      passwordConfirmation: 'otra',
    });

    expect(Object.keys(result.errors).length).toBeGreaterThan(2);
  });
});

describe('validateLoginInput', () => {
  it('exige correo y contraseña', () => {
    const result = validateLoginInput({ email: '', password: '' });

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.password).toBeTruthy();
  });
});

describe('validaciones de la recarga', () => {
  it('exige 16 dígitos en el número de tarjeta', () => {
    expect(validateCardNumber('1234123412341234')).toBeNull();
    expect(validateCardNumber('1234')).toBeTruthy();
  });

  it('acepta el número de tarjeta con espacios', () => {
    expect(validateCardNumber('1234 1234 1234 1234')).toBeNull();
  });

  it('exige el formato MM/AA en la fecha de vencimiento', () => {
    expect(validateExpiryDate('12/26')).toBeNull();
    expect(validateExpiryDate('2026-12')).toBeTruthy();
    expect(validateExpiryDate('13/26')).toBeTruthy();
  });

  it('exige 3 dígitos en el CVV', () => {
    expect(validateCvv('543')).toBeNull();
    expect(validateCvv('54')).toBeTruthy();
  });

  it('exige un monto mayor que cero', () => {
    expect(validateAmount(250)).toBeNull();
    expect(validateAmount(0)).toBeTruthy();
    expect(validateAmount(-10)).toBeTruthy();
    expect(validateAmount(Number.NaN)).toBeTruthy();
  });

  it('devuelve todos los errores de la recarga', () => {
    const result = validateTopUpInput({
      cardNumber: '1234',
      expiryDate: 'x',
      cvv: '1',
      cardHolder: '',
      amount: 0,
    });

    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(5);
  });
});

describe('utilidades de formato', () => {
  it('normaliza el correo a minúsculas', () => {
    expect(normalizeEmail('  ANA@Correo.com ')).toBe('ana@correo.com');
  });

  it('oculta el número de tarjeta salvo los últimos cuatro dígitos', () => {
    expect(maskCardNumber('1234123412341234')).toBe('•••• •••• •••• 1234');
  });

  it('redondea a dos decimales sin errores de coma flotante', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('formatea el monto como moneda', () => {
    expect(formatCurrency(1234.5)).toContain('1,234.50');
  });
});
