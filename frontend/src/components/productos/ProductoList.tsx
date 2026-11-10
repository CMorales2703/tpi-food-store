import type { Table } from '@tanstack/react-table';
import DataTable from '../ui/DataTable';
import SearchInput from '../ui/SearchInput';
import type { Categoria } from '../../types/categoria';
import type { Producto } from '../../types/producto';

interface ProductoListProps {
  /** Tabla de productos creada con useReactTable en ProductsPage. */
  table: Table<Producto>;
  filtro: string;
  onFiltroChange: (valor: string) => void;
  categorias: Categoria[];
  categoriaId: number | null;
  onCategoriaChange: (id: number | null) => void;
}

/** Listado de productos: buscador, filtro por categoría y tabla. Todo llega por props. */
export default function ProductoList({
  table,
  filtro,
  onFiltroChange,
  categorias,
  categoriaId,
  onCategoriaChange,
}: ProductoListProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput valor={filtro} onCambio={onFiltroChange} placeholder="Buscar producto…" />
        <select
          value={categoriaId ?? ''}
          onChange={(e) => onCategoriaChange(e.target.value ? Number(e.target.value) : null)}
          aria-label="Filtrar por categoría"
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <DataTable table={table} mensajeSinResultados="Ningún producto coincide con los filtros." />
    </div>
  );
}
