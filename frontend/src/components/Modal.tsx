import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  /** Conviene memoizarla con useCallback en el padre (es dependencia del efecto). */
  onClose: () => void;
  title: string;
  children: ReactNode;
  ancho?: 'md' | 'lg';
}

/** Modal controlado: el padre decide si se muestra mediante un booleano (useState). */
export default function Modal({ isOpen, onClose, title, children, ancho = 'md' }: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-xl ${
          ancho === 'lg' ? 'max-w-lg' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 id="modal-titulo" className="text-lg font-semibold text-stone-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
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
