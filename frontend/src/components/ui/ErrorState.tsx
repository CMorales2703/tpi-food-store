interface ErrorStateProps {
  mensaje: string;
  onReintentar?: () => void;
}

/** Estado de error de carga reutilizable (por ejemplo, el backend no responde). */
export default function ErrorState({ mensaje, onReintentar }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-10 text-center"
    >
      <p className="font-medium text-red-800">No se pudieron cargar los datos</p>
      <p className="text-sm text-red-700">{mensaje}</p>
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
