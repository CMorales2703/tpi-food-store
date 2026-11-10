import type { Categoria } from './categoria';
import type { Ingrediente } from './ingrediente';

// Interfaces que reflejan los schemas de FastAPI (modules/productos/schemas.py)

/** ProductoRead */
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagenes_url: string[];
  disponible: boolean;
  created_at: string;
  updated_at: string;
  /** La primera es la categoría principal */
  categorias: Categoria[];
  ingredientes: Ingrediente[];
}

/** ProductoCreate: la primera categoría de la lista queda como principal */
export interface ProductoCreate {
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagenes_url: string[];
  disponible: boolean;
  categoria_ids: number[];
  ingrediente_ids: number[];
}

/** ProductoUpdate: todos los campos opcionales */
export type ProductoUpdate = Partial<ProductoCreate>;

/** Valores del formulario de TanStack Form (el precio se edita como texto) */
export interface ProductoFormValues {
  nombre: string;
  descripcion: string;
  precio_base: string;
  imagen_url: string;
  disponible: boolean;
  categoria_ids: number[];
  ingrediente_ids: number[];
}
