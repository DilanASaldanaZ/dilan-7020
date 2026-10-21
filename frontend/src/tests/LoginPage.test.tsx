/**
 * Pruebas del formulario de inicio de sesión.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../pages/LoginPage';
import { renderWithProviders } from './testUtils';

const loginUser = vi.hoisted(() => vi.fn());
const login = vi.hoisted(() => vi.fn());

vi.mock('../services/auth.service', () => ({
  loginUser,
  registerUser: vi.fn(),
  fetchCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    status: 'anonymous',
    user: null,
    token: null,
    login,
    register: vi.fn(),
    logout: vi.fn(),
    updateBalance: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    login.mockReset();
    loginUser.mockReset();
  });

  it('muestra los campos de correo y contraseña', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('muestra un error si el correo no es válido, sin llamar al backend', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'correo-malo');
    await user.type(screen.getByLabelText('Contraseña'), 'Carrera1');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText(/correo electrónico válido/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('muestra un error si la contraseña está vacía', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('La contraseña es obligatoria.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('inicia sesión con los datos válidos', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue(undefined);
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Carrera1');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('ana@correo.com', 'Carrera1'));
  });

  it('muestra el mensaje de error que devuelve el servidor', async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new Error('El correo o la contraseña no son correctos.'));
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Incorrecta1');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(
      await screen.findByText('El correo o la contraseña no son correctos.'),
    ).toBeInTheDocument();
  });
});
