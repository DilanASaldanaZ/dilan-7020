/**
 * Pruebas del formulario de recarga de saldo.
 *
 * Se verifica lo más importante: que un rechazo de la pasarela se muestre
 * al usuario y que el saldo NO se actualice.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../services/api/client';
import { TopUpForm } from '../components/dashboard/TopUpForm';
import { renderWithProviders } from './testUtils';

const topUp = vi.hoisted(() => vi.fn());

vi.mock('../services/payments.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/payments.service')>();
  return { ...actual, topUp };
});

/** Rellena el formulario con los datos de la tarjeta que aprueba el simulador. */
async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Número de tarjeta'), '1234123412341234');
  await user.type(screen.getByLabelText('Vencimiento'), '12/26');
  await user.type(screen.getByLabelText('CVV'), '543');
  await user.type(screen.getByLabelText('Monto de la recarga'), '250');
}

describe('TopUpForm', () => {
  beforeEach(() => {
    topUp.mockReset();
  });

  it('muestra un error de validación si el monto está vacío', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopUpForm token="token" defaultCardHolder="Ana Prueba" onApproved={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Confirmar recarga' }));

    expect(await screen.findByText('El monto de la recarga debe ser mayor que cero.')).toBeInTheDocument();
    expect(topUp).not.toHaveBeenCalled();
  });

  it('limita el vencimiento a números con diagonal automática y el CVV a 3 dígitos', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopUpForm token="token" defaultCardHolder="Ana Prueba" onApproved={vi.fn()} />);

    const expiry = screen.getByLabelText('Vencimiento');
    await user.type(expiry, '12abc26');
    expect(expiry).toHaveValue('12/26');

    const cvv = screen.getByLabelText('CVV');
    await user.type(cvv, '54a321');
    expect(cvv).toHaveValue('543');
  });

  it('limita la tarjeta a 16 dígitos y el titular a letras', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopUpForm token="token" defaultCardHolder="Ana Prueba" onApproved={vi.fn()} />);

    const cardNumber = screen.getByLabelText('Número de tarjeta');
    await user.type(cardNumber, '1234a1234 12341234-9999');
    expect(cardNumber).toHaveValue('1234123412341234');

    const cardHolder = screen.getByLabelText('Nombre completo del titular');
    await user.clear(cardHolder);
    await user.type(cardHolder, 'Ana3 Prueba!');
    expect(cardHolder).toHaveValue('Ana Prueba');
  });

  it('rechaza una tarjeta vencida antes de llamar a la pasarela', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopUpForm token="token" defaultCardHolder="Ana Prueba" onApproved={vi.fn()} />);

    await user.type(screen.getByLabelText('Número de tarjeta'), '1234123412341234');
    await user.type(screen.getByLabelText('Vencimiento'), '0120');
    await user.type(screen.getByLabelText('CVV'), '543');
    await user.type(screen.getByLabelText('Monto de la recarga'), '250');
    await user.click(screen.getByRole('button', { name: 'Confirmar recarga' }));

    expect(await screen.findByText(/La tarjeta está vencida/i)).toBeInTheDocument();
    expect(topUp).not.toHaveBeenCalled();
  });

  it('muestra un error de validación si el CVV no tiene 3 dígitos', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopUpForm token="token" defaultCardHolder="Ana Prueba" onApproved={vi.fn()} />);

    await user.type(screen.getByLabelText('Número de tarjeta'), '1234123412341234');
    await user.type(screen.getByLabelText('Vencimiento'), '12/26');
    await user.type(screen.getByLabelText('CVV'), '12');
    await user.type(screen.getByLabelText('Monto de la recarga'), '250');
    await user.click(screen.getByRole('button', { name: 'Confirmar recarga' }));

    expect(await screen.findByText('El CVV debe tener 3 dígitos.')).toBeInTheDocument();
    expect(topUp).not.toHaveBeenCalled();
  });

  it('muestra el mensaje de la pasarela cuando la operación se rechaza', async () => {
    const user = userEvent.setup();
    const onApproved = vi.fn();

    topUp.mockRejectedValue(
      new ApiError(
        422,
        'VALIDATION_ERROR',
        'No se pudo completar la recarga.',
        {
          payment: {
            id: 'sp_1',
            status: 'failed',
            status_detail:
              'La tarjeta fue rechazada por la entidad emisora: la cuenta no tiene fondos insuficientes para la operación.',
            transaction_amount: 250,
            date_created: '2026-10-21T00:00:00.000Z',
            authorization_code: null,
            reference: 'SP-1',
            payer_id: '1',
            payer_email: 'ana@correo.com',
            card_number: '1234123412341234',
            card_holder: 'Ana Prueba',
            expiry_date: '12/26',
            cvv: '543',
          },
        },
      ),
    );

    renderWithProviders(<TopUpForm token="token" defaultCardHolder="Ana Prueba" onApproved={onApproved} />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar recarga' }));

    expect(await screen.findByText(/fondos insuficientes/i)).toBeInTheDocument();
    expect(onApproved).not.toHaveBeenCalled();
  });

  it('confirma la recarga y avisa del nuevo saldo cuando el cobro se aprueba', async () => {
    const user = userEvent.setup();
    const onApproved = vi.fn();

    topUp.mockResolvedValue({
      payment: {
        id: 'sp_1',
        status: 'approved',
        status_detail: 'Pago aprobado. Se acreditaron $250.00 a tu cuenta.',
        transaction_amount: 250,
        date_created: '2026-10-21T00:00:00.000Z',
        authorization_code: 'AUTH-1234ABCD',
        reference: 'SP-1',
        payer_id: '1',
        payer_email: 'ana@correo.com',
        card_number: '1234123412341234',
        card_holder: 'Ana Prueba',
        expiry_date: '12/26',
        cvv: '543',
      },
      user: {
        id: '1',
        fullName: 'Ana Prueba',
        email: 'ana@correo.com',
        balance: 250,
        createdAt: '2026-10-21T00:00:00.000Z',
      },
    });

    renderWithProviders(<TopUpForm token="token" defaultCardHolder="Ana Prueba" onApproved={onApproved} />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar recarga' }));

    await waitFor(() => expect(onApproved).toHaveBeenCalledWith(250));
    expect(await screen.findByText(/Pago aprobado/i)).toBeInTheDocument();
  });

  it('muestra un mensaje claro cuando la solicitud se agota (timeout)', async () => {
    const user = userEvent.setup();
    const onApproved = vi.fn();

    topUp.mockRejectedValue(
      new ApiError(
        0,
        'TIMEOUT',
        'La solicitud tardó demasiado y se canceló. Revisa tu conexión e inténtalo de nuevo.',
      ),
    );

    renderWithProviders(<TopUpForm token="token" defaultCardHolder="Ana Prueba" onApproved={onApproved} />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar recarga' }));

    expect(await screen.findByText(/tardó demasiado/i)).toBeInTheDocument();
    expect(onApproved).not.toHaveBeenCalled();
  });
});
