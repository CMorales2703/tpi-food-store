import { handleApiError } from '../api/handleApiError';

/** Mensaje de error en línea (por ejemplo, debajo de un formulario). No muestra nada si no hay error. */
export default function MensajeError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {handleApiError(error)}
    </p>
  );
}
