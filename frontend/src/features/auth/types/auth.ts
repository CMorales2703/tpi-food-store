// Tipos de autenticación: mismos nombres de campo que los schemas del backend.

export type Rol = 'user' | 'admin';

/** UserPublic: respuesta de /auth/me, /auth/register y /admin/usuarios. Nunca incluye el token. */
export interface UserPublic {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: Rol;
  disabled: boolean;
  created_at: string;
}

/** UserCreate: body de POST /auth/register */
export interface UserCreate {
  username: string;
  full_name: string;
  email: string;
  password: string;
}

/** Credenciales del login (se envían como formulario OAuth2). */
export interface Credenciales {
  username: string;
  password: string;
}

/** Respuesta de login y logout. */
export interface MensajeRespuesta {
  message: string;
}
