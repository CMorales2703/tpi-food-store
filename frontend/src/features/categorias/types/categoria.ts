// Mismos nombres de campo que los schemas del backend (modules/categorias/schemas.py).

/** CategoriaRead */
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

/** CategoriaCreate */
export interface CategoriaCreate {
  nombre: string;
  descripcion: string | null;
}

/** CategoriaUpdate: actualización parcial */
export type CategoriaUpdate = Partial<CategoriaCreate>;
