/** Indicador de carga (spinner + texto). */
export default function Cargando({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-12 text-stone-500"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
      <span>{mensaje}</span>
    </div>
  );
}
