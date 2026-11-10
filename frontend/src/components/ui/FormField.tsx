import type { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  requerido?: boolean;
  /** Errores de field.state.meta.errors (se muestra el primero). */
  errores?: unknown[];
  /** Se muestran los errores sólo si el campo fue tocado o se intentó enviar. */
  mostrarErrores?: boolean;
  ayuda?: string;
  children: ReactNode;
}

export const inputClass =
  'w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none ' +
  'border-stone-300 focus:border-orange-500 focus:ring-orange-200 ' +
  'aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-200';

/** Envoltorio presentacional de un campo: label + control + error de validación. */
export default function FormField({
  id,
  label,
  requerido = false,
  errores = [],
  mostrarErrores = true,
  ayuda,
  children,
}: FormFieldProps) {
  const error = mostrarErrores && errores.length > 0 ? String(errores[0]) : null;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
        {requerido && <span className="text-orange-600"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        ayuda && <p className="mt-1 text-xs text-stone-400">{ayuda}</p>
      )}
    </div>
  );
}
