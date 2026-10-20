import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './hooks/useAuth';
import { PageLoader } from './components/ui/Spinner';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Ruta protegida: solo deja pasar a quien tiene una sesión activa.
 * Si no la hay, manda al login y recuerda a dónde quería ir el usuario.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <PageLoader label="Comprobando tu sesión…" />;
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** Raíz: lleva al dashboard si hay sesión y al login si no. */
function RootRedirect() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <PageLoader label="Comprobando tu sesión…" />;
  }

  return <Navigate to={status === 'authenticated' ? '/dashboard' : '/login'} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
