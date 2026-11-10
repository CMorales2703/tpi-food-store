import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CLAVE_PRODUCTOS } from '../../productos/hooks/useProductos';
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
} from '../api/categorias';
import type { CategoriaUpdate } from '../types/categoria';

export const CLAVE_CATEGORIAS = ['categorias'] as const;

/** Categorías activas (filtro del catálogo, select de productos y ABM). */
export function useCategorias() {
  return useQuery({
    queryKey: CLAVE_CATEGORIAS,
    queryFn: listarCategorias,
    staleTime: 5 * 60 * 1000, // cambian poco: 5 minutos sin volver a pedirlas
  });
}

/** Invalida categorías y productos (cada producto muestra el nombre de su categoría). */
function useInvalidarCategorias() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CLAVE_CATEGORIAS }),
      queryClient.invalidateQueries({ queryKey: CLAVE_PRODUCTOS }),
    ]);
}

export function useCrearCategoria() {
  const invalidar = useInvalidarCategorias();
  return useMutation({ mutationFn: crearCategoria, onSuccess: invalidar });
}

export function useActualizarCategoria() {
  const invalidar = useInvalidarCategorias();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CategoriaUpdate }) =>
      actualizarCategoria(id, datos),
    onSuccess: invalidar,
  });
}

export function useEliminarCategoria() {
  const invalidar = useInvalidarCategorias();
  return useMutation({ mutationFn: eliminarCategoria, onSuccess: invalidar });
}
