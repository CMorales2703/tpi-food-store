// Interfaces que reflejan los schemas de FastAPI (modules/categorias/schemas.py)

/** CategoriaRead */
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  created_at: string;
  updated_at: string;
}

/** CategoriaCreate */
export interface CategoriaCreate {
  nombre: string;
  descripcion: string;
}

/** CategoriaUpdate: todos los campos opcionales */
export type CategoriaUpdate = Partial<CategoriaCreate>;

/** Valores del formulario de TanStack Form */
export interface CategoriaFormValues {
  nombre: string;
  descripcion: string;
}
