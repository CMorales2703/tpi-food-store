import type { ReactNode } from 'react';

interface EstadoVacioProps {
  titulo: string;
  descripcion?: string;
  icono?: string;
  /** Botón u otra acción para salir del estado vacío. */
  accion?: ReactNode;
}

export default function EstadoVacio({ titulo, descripcion, icono = '🍽️', accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-12 text-center">
      <span className="text-4xl" aria-hidden="true">
        {icono}
      </span>
      <p className="font-medium text-stone-700">{titulo}</p>
      {descripcion && <p className="text-sm text-stone-500">{descripcion}</p>}
      {accion && <div className="pt-2">{accion}</div>}
    </div>
  );
}
