// Formato de los errores de FastAPI.

/** Un error de validación (422): campo y mensaje. */
export interface ErrorValidacion {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/** Cuerpo de error: `detail` es texto (400/401/403/404/409) o una lista (422). */
export interface ErrorBackend {
  detail: string | ErrorValidacion[];
}

/** Respuesta paginada del backend: { total, items }. */
export interface Paginado<T> {
  total: number;
  items: T[];
}
