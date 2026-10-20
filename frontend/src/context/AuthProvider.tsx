/**
 * Provider de autenticación.
 *
 * Responsabilidades:
 *  - Restaurar la sesión guardada en `localStorage` al abrir la app.
 *  - Comprobar con el backend que la sesión sigue siendo válida.
 *  - Guardar y borrar los datos de sesión, perfil y saldo.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PublicUser } from '@carrera/shared';
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context';
import { ApiError } from '../services/api/client';
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from '../services/auth.service';
import { appStorage } from '../utils/storage';

/** Sesión recuperada del navegador. */
interface RestoredSession {
  status: AuthStatus;
  user: PublicUser | null;
  token: string | null;
}

/**
 * Lee la sesión guardada en `localStorage`.
 * Se usa como valor inicial del estado: así el usuario ve su sesión
 * inmediatamente al recargar, sin parpadeos.
 */
function restoreSession(): RestoredSession {
  const storedSession = appStorage.readSession();

  if (!storedSession?.token) {
    return { status: 'anonymous', user: null, token: null };
  }

  return {
    status: 'authenticated',
    user: appStorage.readUser(),
    token: storedSession.token,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialSession] = useState(restoreSession);
  const [status, setStatus] = useState<AuthStatus>(initialSession.status);
  const [user, setUser] = useState<PublicUser | null>(initialSession.user);
  const [token, setToken] = useState<string | null>(initialSession.token);

  /** Guarda la sesión en el estado de React y en `localStorage`. */
  const persistSession = useCallback((nextToken: string, nextUser: PublicUser) => {
    setToken(nextToken);
    setUser(nextUser);
    setStatus('authenticated');

    appStorage.writeSession({ token: nextToken, savedAt: new Date().toISOString() });
    appStorage.writeUser(nextUser);
    appStorage.writeBalance(nextUser.balance);
  }, []);

  /** Confirma con el servidor que la sesión guardada siga siendo válida. */
  useEffect(() => {
    const storedSession = appStorage.readSession();
    if (!storedSession?.token) return;

    let cancelled = false;

    void (async () => {
      try {
        const currentUser = await fetchCurrentUser(storedSession.token);
        if (!cancelled) {
          persistSession(storedSession.token, currentUser);
        }
      } catch (error) {
        if (cancelled) return;

        // Si el servidor dice que la sesión ya no vale, se cierra.
        if (error instanceof ApiError && error.status === 401) {
          appStorage.clear();
          setToken(null);
          setUser(null);
          setStatus('anonymous');
          return;
        }
        // Si es un problema de conexión, se mantiene la sesión local
        // para que el usuario no pierda su trabajo.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [persistSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginUser(email, password);
      persistSession(response.token, response.user);
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      password: string;
      passwordConfirmation: string;
    }) => {
      const response = await registerUser(payload);
      persistSession(response.token, response.user);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    const currentToken = token;
    appStorage.clear();

    setToken(null);
    setUser(null);
    setStatus('anonymous');

    if (currentToken) {
      try {
        await logoutUser(currentToken);
      } catch {
        // Si el servidor no responde, la sesión local ya está cerrada igual.
      }
    }
  }, [token]);

  const updateBalance = useCallback((balance: number) => {
    setUser((current) => {
      if (!current) return current;

      const updated = { ...current, balance };
      // Se mantiene sincronizado el perfil guardado en el navegador.
      appStorage.writeUser(updated);
      appStorage.writeBalance(balance);
      return updated;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, login, register, logout, updateBalance }),
    [status, user, token, login, register, logout, updateBalance],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
