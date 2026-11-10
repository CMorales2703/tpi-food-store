import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listarProductos } from '../api/productos';
import type { FiltrosProductos } from '../types/producto';

export const CLAVE_PRODUCTOS = ['productos'] as const;

/** Productos paginados en el servidor. La queryKey incluye los filtros:
 *  cada combinación (página, búsqueda, categoría) tiene su propia caché. */
export function useProductos(filtros: FiltrosProductos) {
  return useQuery({
    queryKey: [...CLAVE_PRODUCTOS, filtros],
    queryFn: () => listarProductos(filtros),
    // Al cambiar de página se sigue mostrando la anterior hasta que llega la nueva
    placeholderData: keepPreviousData,
  });
}
