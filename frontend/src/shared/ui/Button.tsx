import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';
type Tamano = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  /** Muestra el texto de carga y deshabilita el botón. */
  cargando?: boolean;
  textoCargando?: string;
  anchoCompleto?: boolean;
}

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-orange-600 text-white hover:bg-orange-700',
  secundario: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100',
  peligro: 'bg-red-600 text-white hover:bg-red-700',
  fantasma: 'text-stone-600 hover:bg-stone-100',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
};

export default function Button({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  textoCargando,
  anchoCompleto = false,
  disabled,
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${TAMANOS[tamano]} ${anchoCompleto ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {cargando && textoCargando ? textoCargando : children}
    </button>
  );
}
