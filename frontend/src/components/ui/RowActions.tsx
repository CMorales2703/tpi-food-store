interface RowActionsProps {
  onEditar: () => void;
  onEliminar: () => void;
  eliminando?: boolean;
}

/** Botones Editar / Eliminar de cada fila de la tabla. */
export default function RowActions({ onEditar, onEliminar, eliminando = false }: RowActionsProps) {
  return (
    <div className="flex justify-end gap-2 whitespace-nowrap">
      <button
        type="button"
        onClick={onEditar}
        className="rounded-md border border-stone-300 px-3 py-1 text-stone-700 hover:bg-stone-100"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={onEliminar}
        disabled={eliminando}
        className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {eliminando ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  );
}
