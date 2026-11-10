import type { ColumnDef } from '@tanstack/react-table';
import RowActions from './RowActions';

/**
 * Columna "Acciones" reutilizada por las tres tablas.
 * Lee los manejadores desde table.options.meta (definidos en cada página).
 */
export function columnaAcciones<T extends { id: number }>(): ColumnDef<T> {
  return {
    id: 'acciones',
    header: () => <span className="sr-only">Acciones</span>,
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      return (
        <RowActions
          onEditar={() => meta?.onEditar(row.original)}
          onEliminar={() => meta?.onEliminar(row.original)}
          eliminando={meta?.eliminandoId === row.original.id}
        />
      );
    },
  };
}
