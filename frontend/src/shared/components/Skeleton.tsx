/** Bloque gris animado que ocupa el lugar de un contenido mientras carga. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-stone-200 ${className}`} />;
}

/** Grilla de tarjetas "esqueleto" con la forma de las tarjetas del catálogo. */
export function SkeletonTarjetas({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="mt-4 h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-2/3" />
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Filas "esqueleto" para listas y tablas. */
export function SkeletonFilas({ cantidad = 5 }: { cantidad?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="space-y-3">
      {Array.from({ length: cantidad }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
