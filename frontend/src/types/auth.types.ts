// Tipos de autenticación. Reflejan los schemas del backend (modules/usuarios/schemas.py).

export type Rol = 'user' | 'admin';

/** Datos del usuario autenticado que guarda el AuthStore. Nunca incluye el token. */
export interface UsuarioAuth {
  username: string;
  full_name: string;
  email: string;
  role: Rol;
}

/** UserPublic: respuesta de /auth/me, /auth/register, /auth/token y /admin/usuarios */
export interface UsuarioPublico extends UsuarioAuth {
  id: number;
  disabled: boolean;
  created_at: string;
}

/** Credenciales del formulario de login (se envían como formulario OAuth2) */
export interface LoginCredentials {
  username: string;
  password: string;
}

/** UserCreate: body de POST /auth/register */
export interface RegisterData {
  username: string;
  full_name: string;
  email: string;
  password: string;
}

/** Valores del formulario de registro (incluye la confirmación, que no se envía) */
export interface RegisterFormValues extends RegisterData {
  confirmar: string;
}

/** Respuesta de POST /auth/logout */
export interface MensajeRespuesta {
  detail: string;
}

/** Error de validación de FastAPI (422) */
export interface ErrorValidacion {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/** Cuerpo de error de FastAPI: cadena en 400/401/403/404/409, lista en 422 (RN-12) */
export interface ErrorBackend {
  detail: string | ErrorValidacion[];
}
