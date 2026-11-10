import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../../store/authStore';
import type { ErrorBackend } from '../types/api';
import { ApiError, mensajeDeDetail } from './handleApiError';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

/**
 * Instancia única de Axios para toda la aplicación.
 * withCredentials: el navegador adjunta la cookie HttpOnly `access_token` en cada
 * petición, aunque el backend esté en otro origen (puerto 8000). El frontend nunca
 * lee ni guarda el token.
 */
export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// En estas rutas un 401 es una respuesta esperada (credenciales incorrectas, o no
// hay sesión al abrir la app): la maneja quien llama, no es una sesión vencida.
const RUTAS_SIN_LIMPIEZA = ['/auth/token', '/auth/me'];

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
    const mensaje = mensajeDeDetail(data, status);

    // Sesión vencida o inválida (401), o cuenta desactivada por un admin (400):
    // se limpia el authStore y ProtectedRoute lleva al usuario a /login.
    const sesionVencida = status === 401 && !RUTAS_SIN_LIMPIEZA.some((r) => url.includes(r));
    const cuentaDesactivada = status === 400 && mensaje === 'Cuenta de usuario desactivada';
    if (sesionVencida || cuentaDesactivada) {
      useAuthStore.getState().limpiarSesion();
    }

    return Promise.reject(new ApiError(mensaje, status));
  },
);
