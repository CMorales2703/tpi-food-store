import { flexRender, type Table } from '@tanstack/react-table';

interface DataTableProps<T> {
  /** Instancia creada con useReactTable en la página. */
  table: Table<T>;
  /** Texto cuando el filtro no devuelve filas. */
  mensajeSinResultados?: string;
}

const PAGE_SIZES = [5, 10, 20] as const;

/**
 * Tabla genérica (presentacional): sólo dibuja el marcado de la instancia
 * de TanStack Table que recibe por props. El ordenamiento, el filtro y la
 * paginación los resuelve TanStack Table con el estado definido en la página.
 */
export default function DataTable<T>({
  table,
  mensajeSinResultados = 'No hay resultados para la búsqueda.',
}: DataTableProps<T>) {
  const filas = table.getRowModel().rows;
  const totalFiltradas = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50 text-left text-xs font-semibold tracking-wide text-stone-500 uppercase">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const ordenable = header.column.getCanSort();
                  const orden = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 whitespace-nowrap"
                      aria-sort={
                        orden === 'asc' ? 'ascending' : orden === 'desc' ? 'descending' : undefined
                      }
                    >
                      {header.isPlaceholder ? null : ordenable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 uppercase hover:text-stone-800"
                          title="Ordenar"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-stone-400">
                            {orden === 'asc' ? '▲' : orden === 'desc' ? '▼' : '↕'}
                          </span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filas.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  className="px-4 py-8 text-center text-stone-500"
                >
                  {mensajeSinResultados}
                </td>
              </tr>
            ) : (
              filas.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación (getPaginationRowModel) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        <span>
          {totalFiltradas} registro{totalFiltradas === 1 ? '' : 's'} · Página{' '}
          {table.getPageCount() === 0 ? 0 : pageIndex + 1} de {table.getPageCount()}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <span className="sr-only sm:not-sr-only">Filas</span>
            <select
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="rounded-md border border-stone-300 bg-white px-2 py-1"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border border-stone-300 bg-white px-3 py-1 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹ Anterior
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md border border-stone-300 bg-white px-3 py-1 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente ›
          </button>
        </div>
      </div>
    </div>
  );
}
