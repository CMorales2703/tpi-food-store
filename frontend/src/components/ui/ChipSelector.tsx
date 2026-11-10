interface Opcion {
  id: number;
  nombre: string;
}

interface ChipSelectorProps {
  id: string;
  opciones: Opcion[];
  /** ids seleccionados, en el orden en que se marcaron */
  seleccion: number[];
  onCambio: (seleccion: number[]) => void;
  /** Marca con ★ la primera opción elegida (categoría principal). */
  destacarPrimera?: boolean;
  mensajeVacio: string;
}

/** Selección múltiple con "chips" (la usan categorías e ingredientes del producto). */
export default function ChipSelector({
  id,
  opciones,
  seleccion,
  onCambio,
  destacarPrimera = false,
  mensajeVacio,
}: ChipSelectorProps) {
  if (opciones.length === 0) return <p className="text-sm text-stone-500">{mensajeVacio}</p>;

  const alternar = (opcionId: number): void =>
    onCambio(
      seleccion.includes(opcionId)
        ? seleccion.filter((x) => x !== opcionId)
        : [...seleccion, opcionId],
    );

  return (
    <div id={id} className="flex flex-wrap gap-2">
      {opciones.map((o) => {
        const posicion = seleccion.indexOf(o.id);
        const marcada = posicion >= 0;
        return (
          <button
            key={o.id}
            type="button"
            role="checkbox"
            aria-checked={marcada}
            onClick={() => alternar(o.id)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              marcada
                ? 'border-orange-600 bg-orange-600 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
            }`}
          >
            {o.nombre}
            {destacarPrimera && posicion === 0 && <span className="ml-1 text-xs">★</span>}
          </button>
        );
      })}
    </div>
  );
}
