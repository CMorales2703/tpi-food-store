import type { ReactNode } from 'react';

interface EncabezadoPaginaProps {
  titulo: string;
  descripcion?: string;
  /** Botones a la derecha (por ejemplo, "Nueva categoría"). */
  acciones?: ReactNode;
}

export default function EncabezadoPagina({ titulo, descripcion, acciones }: EncabezadoPaginaProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">{titulo}</h1>
        {descripcion && <p className="text-stone-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex gap-2">{acciones}</div>}
    </div>
  );
}
