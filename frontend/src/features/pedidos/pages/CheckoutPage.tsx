import { Link, Navigate, useNavigate } from 'react-router-dom';
import Card from '../../../shared/ui/Card';
import { formatearPrecio } from '../../../shared/utils/format';
import { useCartStore } from '../../../store/cartStore';
import CheckoutForm, { type DatosCheckout } from '../components/CheckoutForm';
import { useCrearPedido } from '../hooks/usePedidos';

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const vaciar = useCartStore((s) => s.vaciar);
  const crearPedido = useCrearPedido();
  const navigate = useNavigate();

  // Sin nada que confirmar, se vuelve al carrito (que muestra su estado vacío)
  if (items.length === 0 && !crearPedido.isSuccess) return <Navigate to="/carrito" replace />;

  const confirmar = async (datos: DatosCheckout) => {
    const pedido = await crearPedido.mutateAsync({
      // Solo producto y cantidad: el precio lo copia el backend del producto (RN-01)
      items: items.map(({ producto_id, cantidad }) => ({ producto_id, cantidad })),
      forma_pago: datos.forma_pago,
      direccion_entrega: datos.direccion_entrega.trim(),
      notas: datos.notas.trim() || null,
    });
    navigate('/mis-pedidos', { replace: true, state: { pedidoNuevo: pedido.id } });
    vaciar();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Confirmar pedido</h1>
        <Link to="/carrito" className="text-sm text-orange-700 hover:underline">
          ‹ Volver al carrito
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-4 font-semibold text-stone-800">Entrega y pago</h2>
          <CheckoutForm onConfirmar={confirmar} error={crearPedido.error} />
        </Card>

        <Card className="h-fit p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold text-stone-800">Tu pedido</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {items.map((item) => (
              <li key={item.producto_id} className="flex justify-between gap-3 py-2">
                <span className="text-stone-700">
                  {item.cantidad} × {item.nombre}
                </span>
                <span className="font-medium text-stone-800">
                  {formatearPrecio(item.precio_unitario * item.cantidad)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatearPrecio(total)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
