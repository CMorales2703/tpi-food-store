import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export const controlClass =
  'w-full rounded-md border bg-white px-3 py-2 focus:ring-2 focus:outline-none ' +
  'border-stone-300 focus:border-orange-500 focus:ring-orange-200 ' +
  'aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-200';

interface CampoProps {
  id: string;
  label: string;
  requerido?: boolean;
  /** Errores de field.state.meta.errors: se muestra el primero. */
  errores?: unknown[];
  /** Se muestran los errores solo si el campo fue tocado. */
  mostrarErrores?: boolean;
  ayuda?: string;
  children: ReactNode;
}

/** Envoltorio de un campo de formulario: label + control + error o ayuda. */
export function Campo({
  id,
  label,
  requerido = false,
  errores = [],
  mostrarErrores = true,
  ayuda,
  children,
}: CampoProps) {
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

type PropsCampo = Omit<CampoProps, 'children' | 'id'> & { id: string };

type InputProps = PropsCampo & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

/** Input de texto con label y mensaje de error. */
export function Input({ label, requerido, errores, mostrarErrores, ayuda, id, ...props }: InputProps) {
  const invalido = Boolean(mostrarErrores && errores && errores.length > 0);
  return (
    <Campo {...{ id, label, requerido, errores, mostrarErrores, ayuda }}>
      <input id={id} name={id} aria-invalid={invalido} className={controlClass} {...props} />
    </Campo>
  );
}

type TextAreaProps = PropsCampo & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>;

export function TextArea({
  label,
  requerido,
  errores,
  mostrarErrores,
  ayuda,
  id,
  ...props
}: TextAreaProps) {
  const invalido = Boolean(mostrarErrores && errores && errores.length > 0);
  return (
    <Campo {...{ id, label, requerido, errores, mostrarErrores, ayuda }}>
      <textarea
        id={id}
        name={id}
        rows={3}
        aria-invalid={invalido}
        className={controlClass}
        {...props}
      />
    </Campo>
  );
}

type SelectProps = PropsCampo & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'>;

export function Select({
  label,
  requerido,
  errores,
  mostrarErrores,
  ayuda,
  id,
  children,
  ...props
}: SelectProps) {
  const invalido = Boolean(mostrarErrores && errores && errores.length > 0);
  return (
    <Campo {...{ id, label, requerido, errores, mostrarErrores, ayuda }}>
      <select id={id} name={id} aria-invalid={invalido} className={controlClass} {...props}>
        {children}
      </select>
    </Campo>
  );
}
