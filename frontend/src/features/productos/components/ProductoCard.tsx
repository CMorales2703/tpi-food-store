import { formatearPrecio } from '../../../shared/utils/format';
import Button from '../../../shared/ui/Button';
import Card from '../../../shared/ui/Card';
import type { Producto } from '../types/producto';

const ICONO_CATEGORIA: Record<string, string> = {
  pizzas: '🍕',
  empanadas: '🥟',
  hamburguesas: '🍔',
  bebidas: '🥤',
  postres: '🍮',
};

interface ProductoCardProps {
  producto: Producto;
  /** Unidades de este producto que ya están en el carrito. */
  enCarrito: number;
  onAgregar: (producto: Producto) => void;
}

/** Tarjeta del catálogo: presentación pura, recibe el producto y la acción por props. */
export default function ProductoCard({ producto, enCarrito, onAgregar }: ProductoCardProps) {
  const sinStock = producto.stock === 0;
  const alTope = enCarrito >= producto.stock;
  const puedeAgregar = producto.disponible && !sinStock && !alTope;
  const icono = ICONO_CATEGORIA[producto.categoria.nombre.toLowerCase()] ?? '🍽️';

  let motivo: string | null = null;
  if (!producto.disponible) motivo = 'No disponible';
  else if (sinStock) motivo = 'Sin stock';
  else if (alTope) motivo = 'Ya tenés todo el stock en el carrito';

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl" aria-hidden="true">
            {icono}
          </span>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-stone-700">
          {producto.categoria.nombre}
        </span>
        {(!producto.disponible || sinStock) && (
          <span className="absolute top-2 right-2 rounded-full bg-stone-800/85 px-2 py-0.5 text-xs font-medium text-white">
            {!producto.disponible ? 'No disponible' : 'Sin stock'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-stone-800">{producto.nombre}</h3>
        {producto.descripcion && (
          <p className="mt-1 line-clamp-2 text-sm text-stone-500">{producto.descripcion}</p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-bold text-stone-900">
                {formatearPrecio(producto.precio_base)}
              </p>
              {producto.disponible && producto.stock > 0 && producto.stock <= 5 && (
                <p className="text-xs font-medium text-amber-700">¡Quedan {producto.stock}!</p>
              )}
            </div>
            <Button
              tamano="sm"
              disabled={!puedeAgregar}
              title={motivo ?? undefined}
              onClick={() => onAgregar(producto)}
            >
              Agregar
            </Button>
          </div>
          {enCarrito > 0 && (
            <p className="mt-2 text-xs text-green-700">✓ {enCarrito} en el carrito</p>
          )}
        </div>
      </div>
    </Card>
  );
}
