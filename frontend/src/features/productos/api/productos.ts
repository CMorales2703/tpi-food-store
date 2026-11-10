import { axiosInstance } from '../../../shared/api/axiosInstance';
import type {
  FiltrosProductos,
  Producto,
  ProductoCreate,
  ProductosPaginados,
  ProductoStockUpdate,
  ProductoUpdate,
} from '../types/producto';

/** GET /productos — activos, paginados en el servidor, con búsqueda y filtros. */
export async function listarProductos(filtros: FiltrosProductos): Promise<ProductosPaginados> {
  // Los filtros vacíos no se envían
  const params = Object.fromEntries(
    Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== ''),
  );
  return (await axiosInstance.get<ProductosPaginados>('/productos', { params })).data;
}

export async function crearProducto(datos: ProductoCreate): Promise<Producto> {
  return (await axiosInstance.post<Producto>('/productos', datos)).data;
}

export async function actualizarProducto(id: number, datos: ProductoUpdate): Promise<Producto> {
  return (await axiosInstance.put<Producto>(`/productos/${id}`, datos)).data;
}

/** PATCH /productos/{id}/stock */
export async function actualizarStock(id: number, datos: ProductoStockUpdate): Promise<Producto> {
  return (await axiosInstance.patch<Producto>(`/productos/${id}/stock`, datos)).data;
}

/** DELETE /productos/{id} — baja lógica (204). */
export async function eliminarProducto(id: number): Promise<void> {
  await axiosInstance.delete(`/productos/${id}`);
}
