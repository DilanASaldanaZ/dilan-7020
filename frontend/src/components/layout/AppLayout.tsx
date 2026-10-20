import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import './AppLayout.css';

export interface AppLayoutProps {
  children: ReactNode;
}

/** Estructura común de las pantallas con sesión iniciada. */
export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="cc-layout">
      <header className="cc-layout__header">
        <div className="cc-layout__brand">
          <span className="cc-layout__logo" aria-hidden="true">
            🐌
          </span>
          <div>
            <p className="cc-layout__title">Carrera de Caracoles</p>
            <p className="cc-layout__tagline">Apuestas y recargas</p>
          </div>
        </div>

        <div className="cc-layout__session">
          {user ? (
            <div className="cc-layout__user">
              <p className="cc-layout__user-name">{user.fullName}</p>
              <p className="cc-layout__user-email">{user.email}</p>
            </div>
          ) : null}

          <Button variant="secondary" onClick={() => void handleLogout()}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="cc-layout__main">{children}</main>

      <footer className="cc-layout__footer">
        <p>
          Simulación local · No se procesa información financiera real.{' '}
          <Link to="/dashboard">Ir al dashboard</Link>
        </p>
      </footer>
    </div>
  );
}
