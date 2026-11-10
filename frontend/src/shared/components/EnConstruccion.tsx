/** Marcador temporal de las pantallas que se construyen en los pasos 8 y 9. */
export default function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-stone-800">{titulo}</h1>
      <p className="mt-2 text-sm text-stone-500">Pantalla en construcción.</p>
    </div>
  );
}
