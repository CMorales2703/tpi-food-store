import { Link, useNavigate } from 'react-router-dom';
import EstadoVacio from '../../../shared/components/EstadoVacio';
import Button from '../../../shared/ui/Button';
import Card from '../../../shared/ui/Card';
import { formatearPrecio } from '../../../shared/utils/format';
import { useCartStore } from '../../../store/cartStore';

export default function CarritoPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad);
  const quitar = useCartStore((s) => s.quitar);
  const vaciar = useCartStore((s) => s.vaciar);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EstadoVacio
        icono="🛒"
        titulo="Tu carrito está vacío"
        descripcion="Agregá productos desde el catálogo."
        accion={
          <Link
            to="/"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Ver el catálogo
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-stone-800">Tu carrito</h1>
        <Button variante="fantasma" tamano="sm" onClick={vaciar}>
          Vaciar carrito
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="divide-y divide-stone-100 lg:col-span-2">
          {items.map((item) => (
            <div key={item.producto_id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-40 flex-1">
                <p className="font-medium text-stone-800">{item.nombre}</p>
                <p className="text-sm text-stone-500">
                  {formatearPrecio(item.precio_unitario)} c/u
                </p>
              </div>

              <div className="flex items-center rounded-md border border-stone-300">
                <button
                  type="button"
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                  className="px-3 py-1 text-lg text-stone-600 hover:bg-stone-100"
                  aria-label={`Quitar una unidad de ${item.nombre}`}
                >
                  −
                </button>
                <span className="w-10 text-center font-medium" aria-live="polite">
                  {item.cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                  className="px-3 py-1 text-lg text-stone-600 hover:bg-stone-100"
                  aria-label={`Agregar una unidad de ${item.nombre}`}
                >
                  +
                </button>
              </div>

              <p className="w-28 text-right font-semibold text-stone-800">
                {formatearPrecio(item.precio_unitario * item.cantidad)}
              </p>

              <button
                type="button"
                onClick={() => quitar(item.producto_id)}
                className="text-sm text-red-600 hover:underline"
              >
                Quitar
              </button>
            </div>
          ))}
        </Card>

        <Card className="h-fit space-y-4 p-5">
          <h2 className="font-semibold text-stone-800">Resumen</h2>
          <div className="flex justify-between text-lg font-bold text-stone-900">
            <span>Total</span>
            <span>{formatearPrecio(total)}</span>
          </div>
          <p className="text-xs text-stone-500">
            El precio final y el stock se confirman al crear el pedido.
          </p>
          <Button anchoCompleto onClick={() => navigate('/checkout')}>
            Continuar
          </Button>
          <Link to="/" className="block text-center text-sm text-orange-700 hover:underline">
            Seguir comprando
          </Link>
        </Card>
      </div>
    </div>
  );
}
