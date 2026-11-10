import { formatearFecha, formatearPrecio } from '../../../shared/utils/format';
import type { Pedido } from '../types/pedido';

const ETIQUETA_PAGO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia' } as const;

/** Detalle de un pedido: líneas (con el precio copiado al crearlo), entrega y pago. */
export default function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="text-left text-xs text-stone-500 uppercase">
            <tr>
              <th className="py-2 pr-3 font-medium">Producto</th>
              <th className="px-3 py-2 text-right font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">Precio</th>
              <th className="py-2 pl-3 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {pedido.items.map((item) => (
              <tr key={item.producto_id}>
                <td className="py-2 pr-3 text-stone-800">{item.nombre_producto}</td>
                <td className="px-3 py-2 text-right">{item.cantidad}</td>
                <td className="px-3 py-2 text-right">{formatearPrecio(item.precio_unitario)}</td>
                <td className="py-2 pl-3 text-right font-medium">
                  {formatearPrecio(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-stone-200">
              <td colSpan={3} className="pt-2 text-right font-semibold">
                Total
              </td>
              <td className="pt-2 pl-3 text-right font-bold">{formatearPrecio(pedido.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <dl className="grid gap-x-6 gap-y-2 rounded-lg bg-stone-50 p-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-stone-500">Dirección de entrega</dt>
          <dd className="text-stone-800">{pedido.direccion_entrega}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Forma de pago</dt>
          <dd className="text-stone-800">{ETIQUETA_PAGO[pedido.forma_pago]}</dd>
        </div>
        {pedido.notas && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-stone-500">Notas</dt>
            <dd className="text-stone-800">{pedido.notas}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-stone-500">Creado</dt>
          <dd className="text-stone-800">{formatearFecha(pedido.created_at)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Última actualización</dt>
          <dd className="text-stone-800">{formatearFecha(pedido.updated_at)}</dd>
        </div>
      </dl>
    </div>
  );
}
