import { useQuery } from '@tanstack/react-query';
import { listarCategorias } from '../api/categorias';

export const CLAVE_CATEGORIAS = ['categorias'] as const;

/** Categorías activas (filtro del catálogo y formulario de productos). */
export function useCategorias() {
  return useQuery({
    queryKey: CLAVE_CATEGORIAS,
    queryFn: listarCategorias,
    staleTime: 5 * 60 * 1000, // cambian poco: 5 minutos sin volver a pedirlas
  });
}
