/**
 * Pruebas de los formateadores de entrada de la tarjeta.
 *
 * El formulario de recarga los usa en cada pulsación de tecla, así que aquí se
 * comprueba que el usuario no pueda escribir letras, que la diagonal aparezca
 * sola y que la longitud quede limitada.
 */
import { describe, expect, it } from 'vitest';
import { formatCardHolderInput, formatCardNumberInput, formatCvvInput, formatExpiryDateInput } from '../src/index.js';

describe('formatExpiryDateInput', () => {
  it('acepta solo dígitos', () => {
    expect(formatExpiryDateInput('1a2b')).toBe('12/');
  });

  it('inserta la diagonal al escribir el segundo dígito', () => {
    expect(formatExpiryDateInput('1')).toBe('1');
    expect(formatExpiryDateInput('12')).toBe('12/');
  });

  it('completa el año mientras se escribe', () => {
    expect(formatExpiryDateInput('12/2')).toBe('12/2');
    expect(formatExpiryDateInput('1226')).toBe('12/26');
  });

  it('ignora los dígitos de más', () => {
    expect(formatExpiryDateInput('122612')).toBe('12/26');
  });

  it('permite borrar la diagonal llevándose el último dígito del mes', () => {
    expect(formatExpiryDateInput('12', '12/')).toBe('1');
  });

  it('mantiene la diagonal al borrar el año', () => {
    expect(formatExpiryDateInput('12/', '12/2')).toBe('12/');
  });

  it('devuelve una cadena vacía si no hay dígitos', () => {
    expect(formatExpiryDateInput('mm/aa')).toBe('');
  });
});

describe('formatCardNumberInput', () => {
  it('acepta solo dígitos', () => {
    expect(formatCardNumberInput('1234 1234-1234a1234')).toBe('1234123412341234');
  });

  it('limita el número de tarjeta a dieciséis dígitos', () => {
    expect(formatCardNumberInput('123412341234123499')).toBe('1234123412341234');
  });

  it('devuelve una cadena vacía si no hay dígitos', () => {
    expect(formatCardNumberInput('tarjeta')).toBe('');
  });
});

describe('formatCardHolderInput', () => {
  it('acepta solo letras y espacios', () => {
    expect(formatCardHolderInput('Ana3  Prueba!')).toBe('Ana Prueba');
  });

  it('conserva las letras acentuadas', () => {
    expect(formatCardHolderInput('José Núñez')).toBe('José Núñez');
  });

  it('elimina los espacios repetidos', () => {
    expect(formatCardHolderInput('Ana    Prueba')).toBe('Ana Prueba');
  });

  it('limita el nombre a ochenta caracteres', () => {
    expect(formatCardHolderInput('a'.repeat(100))).toHaveLength(80);
  });
});

describe('formatCvvInput', () => {
  it('acepta solo dígitos', () => {
    expect(formatCvvInput('5a4b3')).toBe('543');
  });

  it('limita el CVV a tres dígitos', () => {
    expect(formatCvvInput('54321')).toBe('543');
  });

  it('permite escribir un CVV incompleto', () => {
    expect(formatCvvInput('54')).toBe('54');
  });
});
