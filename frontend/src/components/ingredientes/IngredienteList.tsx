import type { Table } from '@tanstack/react-table';
import DataTable from '../ui/DataTable';
import SearchInput from '../ui/SearchInput';
import type { Ingrediente } from '../../types/ingrediente';

interface IngredienteListProps {
  /** Tabla de ingredientes creada con useReactTable en IngredientesPage. */
  table: Table<Ingrediente>;
  filtro: string;
  onFiltroChange: (valor: string) => void;
}

/** Listado de ingredientes: recibe los datos (la tabla) y las funciones por props. */
export default function IngredienteList({ table, filtro, onFiltroChange }: IngredienteListProps) {
  return (
    <div className="space-y-3">
      <SearchInput valor={filtro} onCambio={onFiltroChange} placeholder="Buscar ingrediente…" />
      <DataTable
        table={table}
        mensajeSinResultados="Ningún ingrediente coincide con la búsqueda."
      />
    </div>
  );
}
