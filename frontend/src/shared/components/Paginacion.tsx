interface PaginacionProps {
  /** Página actual, empezando en 0 (skip = pagina × limit). */
  pagina: number;
  total: number;
  porPagina: number;
  onCambiar: (pagina: number) => void;
}

/** Paginación del lado del servidor: el padre pide la página con skip y limit. */
export default function Paginacion({ pagina, total, porPagina, onCambiar }: PaginacionProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  if (total <= porPagina) return null;

  const desde = pagina * porPagina + 1;
  const hasta = Math.min(total, (pagina + 1) * porPagina);

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600"
    >
      <span>
        {desde}–{hasta} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina === 0}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹ Anterior
        </button>
        <span>
          Página {pagina + 1} de {totalPaginas}
        </span>
        <button
          type="button"
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina + 1 >= totalPaginas}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente ›
        </button>
      </div>
    </nav>
  );
}
