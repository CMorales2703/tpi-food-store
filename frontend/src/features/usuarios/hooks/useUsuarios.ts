import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { activarUsuario, desactivarUsuario, listarUsuarios } from '../api/usuarios';

export const CLAVE_USUARIOS = ['usuarios'] as const;

export function useUsuarios() {
  return useQuery({ queryKey: CLAVE_USUARIOS, queryFn: listarUsuarios });
}

/** Activar o desactivar (baja lógica con disabled). Invalida el listado al terminar. */
export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activar }: { id: number; activar: boolean }) =>
      activar ? activarUsuario(id) : desactivarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS }),
  });
}
