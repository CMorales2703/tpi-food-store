// Interfaces que reflejan los schemas de FastAPI (modules/ingredientes/schemas.py)

/** IngredienteRead */
export interface Ingrediente {
  id: number;
  nombre: string;
  created_at: string;
  updated_at: string;
}

/** IngredienteCreate / IngredienteUpdate */
export interface IngredienteCreate {
  nombre: string;
}

export type IngredienteUpdate = IngredienteCreate;

/** Valores del formulario de TanStack Form */
export interface IngredienteFormValues {
  nombre: string;
}
