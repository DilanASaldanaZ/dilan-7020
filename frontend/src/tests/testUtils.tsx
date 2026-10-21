/**
 * Utilidades compartidas por las pruebas de la interfaz.
 */
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';

/** Renderiza un componente dentro de un router y del provider de autenticación. */
export function renderWithProviders(ui: ReactElement, initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}
