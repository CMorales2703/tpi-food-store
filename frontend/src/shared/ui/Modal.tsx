import type { ReactNode } from 'react';

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  ancho?: 'md' | 'lg';
}

/** Lleva el foco al diálogo al abrirlo (si ningún campo de adentro lo tomó con autoFocus),
 *  para que Escape funcione. Es una función fija: React la llama solo al montar y desmontar. */
const enfocarAlAbrir = (nodo: HTMLDivElement | null): void => {
  if (nodo && !nodo.contains(document.activeElement)) nodo.focus();
};

/** Modal controlado: el padre decide si se muestra. Se cierra con Escape, con la × o con clic afuera. */
export default function Modal({ abierto, onCerrar, titulo, children, ancho = 'md' }: ModalProps) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        // Recibe el foco al abrirse, así Escape funciona sin un listener global (sin useEffect)
        tabIndex={-1}
        ref={enfocarAlAbrir}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCerrar();
        }}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-xl outline-none ${
          ancho === 'lg' ? 'max-w-2xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 id="modal-titulo" className="text-lg font-semibold text-stone-800">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-2xl leading-none text-stone-400 hover:text-stone-700"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
