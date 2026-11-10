import { handleApiError } from '../api/handleApiError';

interface EstadoErrorProps {
  error: unknown;
  onReintentar?: () => void;
}

/** Error al cargar datos (por ejemplo, el backend no responde). */
export default function EstadoError({ error, onReintentar }: EstadoErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center"
    >
      <p className="font-medium text-red-800">No se pudieron cargar los datos</p>
      <p className="text-sm text-red-700">{handleApiError(error)}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="rounded-md border border-red-300 bg-white px-4 py-1.5 text-sm text-red-700 hover:bg-red-100"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
