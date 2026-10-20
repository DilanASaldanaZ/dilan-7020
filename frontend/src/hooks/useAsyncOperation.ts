/**
 * Hook para manejar estados de carga y error de una operación asíncrona.
 * Evita repetir el mismo `try/catch/finally` en cada componente.
 */
import { useCallback, useState } from 'react';

export interface AsyncState {
  loading: boolean;
  error: string | null;
}

/**
 * @param operation promesa que se ejecuta.
 * @returns estado de carga/error y un envoltorio para ejecutar la operación.
 */
export function useAsyncOperation<TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
) {
  const [state, setState] = useState<AsyncState>({ loading: false, error: null });

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setState({ loading: true, error: null });
      try {
        const result = await operation(...args);
        setState({ loading: false, error: null });
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Ocurrió un error inesperado. Inténtalo de nuevo.';
        setState({ loading: false, error: message });
        return undefined;
      }
    },
    [operation],
  );

  const clearError = useCallback(() => setState((current) => ({ ...current, error: null })), []);

  return { ...state, run, clearError };
}
