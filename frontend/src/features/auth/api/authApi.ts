import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { Credenciales, MensajeRespuesta, UserCreate, UserPublic } from '../types/auth';

/** POST /auth/token — formulario OAuth2. El backend responde con la cookie HttpOnly. */
export async function login({ username, password }: Credenciales): Promise<MensajeRespuesta> {
  const form = new URLSearchParams({ username, password });
  const { data } = await axiosInstance.post<MensajeRespuesta>('/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

/** GET /auth/me — usuario de la cookie actual. */
export async function obtenerPerfil(): Promise<UserPublic> {
  const { data } = await axiosInstance.get<UserPublic>('/auth/me');
  return data;
}

/** POST /auth/logout — el backend borra la cookie. */
export async function logout(): Promise<void> {
  await axiosInstance.post<MensajeRespuesta>('/auth/logout');
}

/** POST /auth/register — registro público (siempre rol user). */
export async function registrar(datos: UserCreate): Promise<UserPublic> {
  const { data } = await axiosInstance.post<UserPublic>('/auth/register', datos);
  return data;
}
