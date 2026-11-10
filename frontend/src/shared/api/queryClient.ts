import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './handleApiError';

/** Instancia única de TanStack Query. El authStore la vacía al iniciar y cerrar
 *  sesión, para que un usuario no vea datos cacheados de otro. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Un reintento ante errores de red; nunca ante 4xx (no se arreglan solos)
      retry: (fallas, error) =>
        fallas < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
});
