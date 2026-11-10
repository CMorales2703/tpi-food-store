import { axiosInstance } from './axiosInstance';
import type {
  LoginCredentials,
  MensajeRespuesta,
  RegisterData,
  UsuarioPublico,
} from '../types/auth.types';

/** POST /auth/token — formulario OAuth2. El backend responde con la cookie HttpOnly. */
export async function loginRequest({ username, password }: LoginCredentials): Promise<void> {
  const form = new URLSearchParams({ username, password });
  await axiosInstance.post<UsuarioPublico>('/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

/** GET /auth/me — datos del usuario de la cookie actual. */
export async function meRequest(): Promise<UsuarioPublico> {
  const { data } = await axiosInstance.get<UsuarioPublico>('/auth/me');
  return data;
}

/** POST /auth/logout — el backend borra la cookie con un Set-Cookie. */
export async function logoutRequest(): Promise<void> {
  await axiosInstance.post<MensajeRespuesta>('/auth/logout');
}

/** POST /auth/register — registro público (siempre rol user). */
export async function registerRequest(datos: RegisterData): Promise<UsuarioPublico> {
  const { data } = await axiosInstance.post<UsuarioPublico>('/auth/register', datos);
  return data;
}

// ---------- Administración de usuarios (sólo admin) ----------
export const usuariosApi = {
  listar: async (): Promise<UsuarioPublico[]> =>
    (await axiosInstance.get<UsuarioPublico[]>('/admin/usuarios')).data,
  activar: async (id: number): Promise<UsuarioPublico> =>
    (await axiosInstance.post<UsuarioPublico>(`/admin/usuarios/${id}/activar`)).data,
  desactivar: async (id: number): Promise<UsuarioPublico> =>
    (await axiosInstance.post<UsuarioPublico>(`/admin/usuarios/${id}/desactivar`)).data,
};
