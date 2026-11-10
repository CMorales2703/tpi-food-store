import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CLAVE_PRODUCTOS } from '../../productos/hooks/useProductos';
import {
  cambiarEstadoPedido,
  cancelarPedido,
  crearPedido,
  listarPedidos,
  obtenerResumen,
  type FiltrosPedidos,
} from '../api/pedidos';
import type { EstadoPedido } from '../types/pedido';

export const CLAVE_PEDIDOS = ['pedidos'] as const;
export const CLAVE_RESUMEN = ['pedidos', 'resumen'] as const;

/** Pedidos paginados: propios (user) o todos (admin). */
export function usePedidos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: [...CLAVE_PEDIDOS, 'lista', filtros],
    queryFn: () => listarPedidos(filtros),
    placeholderData: keepPreviousData,
  });
}

/** Indicadores del panel de administración. */
export function useResumenPedidos() {
  return useQuery({ queryKey: CLAVE_RESUMEN, queryFn: obtenerResumen });
}

/** Al crear o cancelar un pedido cambia el stock: se invalidan pedidos (incluido
 *  el resumen) y productos, para que el catálogo muestre el stock actualizado. */
function useInvalidarPedidosYStock() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CLAVE_PEDIDOS }),
      queryClient.invalidateQueries({ queryKey: CLAVE_PRODUCTOS }),
    ]);
}

export function useCrearPedido() {
  const invalidar = useInvalidarPedidosYStock();
  return useMutation({ mutationFn: crearPedido, onSuccess: invalidar });
}

export function useCancelarPedido() {
  const invalidar = useInvalidarPedidosYStock();
  return useMutation({ mutationFn: cancelarPedido, onSuccess: invalidar });
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarPedidosYStock();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) =>
      cambiarEstadoPedido(id, estado),
    onSuccess: invalidar,
  });
}
