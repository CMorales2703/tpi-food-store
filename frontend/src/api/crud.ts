import { axiosInstance } from './axiosInstance';

/** Funciones de acceso REST para un recurso con CRUD estándar. */
export interface CrudApi<T, TCreate, TUpdate> {
  listar: () => Promise<T[]>;
  crear: (data: TCreate) => Promise<T>;
  actualizar: (args: { id: number; data: TUpdate }) => Promise<T>;
  eliminar: (id: number) => Promise<void>;
}

/**
 * Lógica reutilizada por Categorías, Productos e Ingredientes: los cuatro
 * endpoints siguen el mismo patrón, sólo cambia el recurso. Todas las
 * peticiones pasan por la instancia de Axios (cookie + interceptores).
 */
export function crearCrudApi<T, TCreate, TUpdate = Partial<TCreate>>(
  recurso: string,
): CrudApi<T, TCreate, TUpdate> {
  return {
    listar: async () => (await axiosInstance.get<T[]>(`/${recurso}/`)).data,
    crear: async (data) => (await axiosInstance.post<T>(`/${recurso}/`, data)).data,
    actualizar: async ({ id, data }) =>
      (await axiosInstance.put<T>(`/${recurso}/${id}`, data)).data,
    eliminar: async (id) => {
      await axiosInstance.delete(`/${recurso}/${id}`);
    },
  };
}
