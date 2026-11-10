interface PageHeaderProps {
  titulo: string;
  descripcion: string;
  textoBoton?: string;
  /** Si no se pasa, no se muestra el botón (por ejemplo, para un usuario sin rol admin). */
  onNuevo?: () => void;
}

/** Encabezado de página con el botón "Nueva …" opcional. */
export default function PageHeader({ titulo, descripcion, textoBoton, onNuevo }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">{titulo}</h1>
        <p className="text-sm text-stone-500">{descripcion}</p>
      </div>
      {onNuevo && textoBoton && (
        <button
          type="button"
          onClick={onNuevo}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-700"
        >
          + {textoBoton}
        </button>
      )}
    </header>
  );
}
