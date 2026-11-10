// Mismos nombres de campo que los schemas del backend (modules/productos/schemas.py).
import type { Paginado } from '../../../shared/types/api';
import type { Categoria } from '../../categorias/types/categoria';

/** ProductoRead: incluye su categoría. */
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  stock: number;
  disponible: boolean;
  categoria_id: number;
  activo: boolean;
  categoria: Categoria;
}

/** ProductosPaginados */
export type ProductosPaginados = Paginado<Producto>;

/** Query params de GET /productos */
export interface FiltrosProductos {
  skip: number;
  limit: number;
  search?: string;
  categoria_id?: number;
  disponible?: boolean;
}

/** ProductoCreate */
export interface ProductoCreate {
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  stock: number;
  disponible: boolean;
  categoria_id: number;
}

/** ProductoUpdate: actualización parcial */
export type ProductoUpdate = Partial<ProductoCreate>;

/** ProductoStockUpdate */
export interface ProductoStockUpdate {
  stock: number;
  disponible: boolean;
}
