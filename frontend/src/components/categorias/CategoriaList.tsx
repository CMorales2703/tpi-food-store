import type { Table } from '@tanstack/react-table';
import DataTable from '../ui/DataTable';
import SearchInput from '../ui/SearchInput';
import type { Categoria } from '../../types/categoria';

interface CategoriaListProps {
  /** Tabla de categorías creada con useReactTable en CategoriasPage. */
  table: Table<Categoria>;
  filtro: string;
  onFiltroChange: (valor: string) => void;
}

/** Listado de categorías: recibe los datos (la tabla) y las funciones por props. */
export default function CategoriaList({ table, filtro, onFiltroChange }: CategoriaListProps) {
  return (
    <div className="space-y-3">
      <SearchInput
        valor={filtro}
        onCambio={onFiltroChange}
        placeholder="Buscar por nombre o descripción…"
      />
      <DataTable table={table} mensajeSinResultados="Ninguna categoría coincide con la búsqueda." />
    </div>
  );
}
