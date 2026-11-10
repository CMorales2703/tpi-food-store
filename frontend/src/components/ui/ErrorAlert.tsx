interface ErrorAlertProps {
  mensaje: string | null | undefined;
  onCerrar?: () => void;
}

/** Aviso de error en línea (errores de la API al guardar o eliminar). */
export default function ErrorAlert({ mensaje, onCerrar }: ErrorAlertProps) {
  if (!mensaje) return null;
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <span>{mensaje}</span>
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="leading-none font-bold text-red-500 hover:text-red-800"
        >
          ×
        </button>
      )}
    </div>
  );
}
