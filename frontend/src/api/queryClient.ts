import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './axiosInstance';

/** Cliente de TanStack Query compartido: el AuthStore lo vacía al iniciar y cerrar
 *  sesión, para que un usuario no vea datos cacheados de otro. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Un reintento ante errores de red; nunca ante 401/403 (no se arreglan solos)
      retry: (fallas, error) =>
        fallas < 1 && !(error instanceof ApiError && [401, 403].includes(error.status)),
    },
  },
});
