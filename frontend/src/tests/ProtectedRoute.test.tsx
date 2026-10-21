/**
 * Pruebas de la ruta protegida: el dashboard solo se abre con sesión activa.
 */
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../App';
import { renderWithProviders } from './testUtils';

const authState = vi.hoisted(() => ({
  status: 'anonymous' as 'loading' | 'authenticated' | 'anonymous',
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    status: authState.status,
    user: authState.status === 'authenticated'
      ? { id: '1', fullName: 'Ana Prueba', email: 'ana@correo.com', balance: 0, createdAt: '' }
      : null,
    token: authState.status === 'authenticated' ? 'token' : null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateBalance: vi.fn(),
  }),
}));

describe('ProtectedRoute', () => {
  it('redirige al login cuando no hay sesión', () => {
    authState.status = 'anonymous';

    renderWithProviders(
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <p>Contenido del dashboard</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>Pantalla de login</p>} />
      </Routes>,
      '/dashboard',
    );

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido del dashboard')).not.toBeInTheDocument();
  });

  it('muestra el contenido cuando hay sesión activa', () => {
    authState.status = 'authenticated';

    renderWithProviders(
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <p>Contenido del dashboard</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>Pantalla de login</p>} />
      </Routes>,
      '/dashboard',
    );

    expect(screen.getByText('Contenido del dashboard')).toBeInTheDocument();
  });
});
