import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types/categoria';

/** GET /categorias — solo las activas (público). */
export async function listarCategorias(): Promise<Categoria[]> {
  return (await axiosInstance.get<Categoria[]>('/categorias')).data;
}

export async function crearCategoria(datos: CategoriaCreate): Promise<Categoria> {
  return (await axiosInstance.post<Categoria>('/categorias', datos)).data;
}

export async function actualizarCategoria(id: number, datos: CategoriaUpdate): Promise<Categoria> {
  return (await axiosInstance.put<Categoria>(`/categorias/${id}`, datos)).data;
}

/** DELETE /categorias/{id} — baja lógica (204). */
export async function eliminarCategoria(id: number): Promise<void> {
  await axiosInstance.delete(`/categorias/${id}`);
}
