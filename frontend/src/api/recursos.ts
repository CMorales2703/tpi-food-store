import { crearCrudApi } from './crud';
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types/categoria';
import type { Ingrediente, IngredienteCreate, IngredienteUpdate } from '../types/ingrediente';
import type { Producto, ProductoCreate, ProductoUpdate } from '../types/producto';

export const categoriasApi = crearCrudApi<Categoria, CategoriaCreate, CategoriaUpdate>(
  'categorias',
);
export const productosApi = crearCrudApi<Producto, ProductoCreate, ProductoUpdate>('productos');
export const ingredientesApi = crearCrudApi<Ingrediente, IngredienteCreate, IngredienteUpdate>(
  'ingredientes',
);

/** Claves de TanStack Query: cada mutación invalida la de su listado. */
export const QUERY_KEYS = {
  categorias: ['categorias'],
  productos: ['productos'],
  ingredientes: ['ingredientes'],
} as const;
