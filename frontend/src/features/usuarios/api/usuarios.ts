import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { UserPublic } from '../../auth/types/auth';

/** GET /admin/usuarios — todos, activos y desactivados. */
export async function listarUsuarios(): Promise<UserPublic[]> {
  return (await axiosInstance.get<UserPublic[]>('/admin/usuarios')).data;
}

export async function activarUsuario(id: number): Promise<UserPublic> {
  return (await axiosInstance.post<UserPublic>(`/admin/usuarios/${id}/activar`)).data;
}

export async function desactivarUsuario(id: number): Promise<UserPublic> {
  return (await axiosInstance.post<UserPublic>(`/admin/usuarios/${id}/desactivar`)).data;
}
