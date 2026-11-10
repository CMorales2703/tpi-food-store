import type { ReactNode } from 'react';

interface EmptyStateProps {
  titulo: string;
  descripcion?: string;
  /** Botón u otra acción para salir del estado vacío. */
  accion?: ReactNode;
}

/** Estado vacío reutilizable. */
export default function EmptyState({ titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-4 py-12 text-center">
      <p className="font-medium text-stone-700">{titulo}</p>
      {descripcion && <p className="text-sm text-stone-500">{descripcion}</p>}
      {accion && <div className="pt-2">{accion}</div>}
    </div>
  );
}
