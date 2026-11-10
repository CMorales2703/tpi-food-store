import type { ErrorBackend } from '../types/api';

/** Error de la API con el mensaje legible y el código HTTP (0 = sin conexión). */
export class ApiError extends Error {
  readonly status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Convierte el `detail` de FastAPI (texto o lista de errores de validación) en un mensaje. */
export function mensajeDeDetail(data: ErrorBackend | undefined, status: number): string {
  const detail = data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => `${String(e.loc.at(-1))}: ${e.msg}`).join(' · ');
  }
  return `Error ${status}`;
}

/** Mensaje para mostrar en pantalla a partir de cualquier error (de una query o mutation). */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado';
}
