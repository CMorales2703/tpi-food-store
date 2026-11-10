import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actualizarProducto,
  actualizarStock,
  crearProducto,
  eliminarProducto,
  listarProductos,
} from '../api/productos';
import type { FiltrosProductos, ProductoStockUpdate, ProductoUpdate } from '../types/producto';

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

// ---------- Mutations del panel de administración ----------

function useInvalidarProductos() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CLAVE_PRODUCTOS });
}

export function useCrearProducto() {
  const invalidar = useInvalidarProductos();
  return useMutation({ mutationFn: crearProducto, onSuccess: invalidar });
}

export function useActualizarProducto() {
  const invalidar = useInvalidarProductos();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoUpdate }) =>
      actualizarProducto(id, datos),
    onSuccess: invalidar,
  });
}

export function useActualizarStock() {
  const invalidar = useInvalidarProductos();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoStockUpdate }) =>
      actualizarStock(id, datos),
    onSuccess: invalidar,
  });
}

export function useEliminarProducto() {
  const invalidar = useInvalidarProductos();
  return useMutation({ mutationFn: eliminarProducto, onSuccess: invalidar });
}
