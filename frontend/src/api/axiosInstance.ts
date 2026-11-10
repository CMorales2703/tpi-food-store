import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ErrorBackend } from '../types/auth.types';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * Instancia única de Axios para toda la aplicación (HU-07).
 * withCredentials: el navegador adjunta la cookie HttpOnly `access_token`
 * en cada petición al backend, aunque esté en otro origen (puerto 8000).
 */
export const axiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Error con el mensaje legible del backend y el código HTTP. */
export class ApiError extends Error {
  readonly status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Convierte el `detail` de FastAPI (cadena o lista de errores de Pydantic) en texto. */
function mensajeDeError(data: ErrorBackend | undefined, status: number): string {
  const detail = data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => `${e.loc.at(-1)}: ${e.msg}`).join(' · ');
  return `Error ${status}`;
}

// En estas rutas un 401 es una respuesta esperada (credenciales incorrectas o
// sesión inexistente al iniciar), no una sesión vencida: las maneja quien llama.
const RUTAS_SIN_LIMPIEZA = ['/auth/token', '/auth/me'];

// ---------- Interceptor de solicitud ----------
// NO maneja el token: viaja en la cookie HttpOnly, que JavaScript no puede leer
// y el navegador adjunta solo (RN-03). Ningún archivo del frontend lee ni guarda el token.
axiosInstance.interceptors.request.use((config) => config);

// ---------- Interceptor de respuesta ----------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorBackend>) => {
    // Sin respuesta: backend apagado, URL incorrecta o CORS mal configurado
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          `No se pudo conectar con el servidor (${API_URL}). Verificá que el backend esté corriendo.`,
          0,
        ),
      );
    }

    const { status, data } = error.response;
    const url = error.config?.url ?? '';
    const mensaje = mensajeDeError(data, status);

    // 401 = sesión vencida o inválida → se limpia el AuthStore y ProtectedRoute
    // redirige a /login. También una cuenta desactivada por un admin (400).
    const sesionVencida = status === 401 && !RUTAS_SIN_LIMPIEZA.some((r) => url.includes(r));
    const cuentaDesactivada = status === 400 && mensaje === 'Cuenta de usuario desactivada';
    if (sesionVencida || cuentaDesactivada) {
      useAuthStore.getState().clearSession();
    }

    return Promise.reject(new ApiError(mensaje, status));
  },
);
