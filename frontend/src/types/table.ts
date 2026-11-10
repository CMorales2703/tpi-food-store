import type { RowData } from '@tanstack/react-table';

// Las acciones de cada fila llegan a la tabla por `meta` (opción de useReactTable).
// Así las columnas pueden definirse una sola vez, fuera del componente,
// sin depender de funciones que cambian en cada render.
declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    onEditar: (fila: TData) => void;
    onEliminar: (fila: TData) => void;
    /** id de la fila que se está eliminando (para deshabilitar su botón). */
    eliminandoId: number | null;
  }
}
