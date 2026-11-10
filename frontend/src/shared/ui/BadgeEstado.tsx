import type { EstadoPedido } from '../../features/pedidos/types/pedido';

const ESTILOS: Record<EstadoPedido, { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'bg-amber-100 text-amber-800 ring-amber-200' },
  EN_PREPARACION: { texto: 'En preparación', clase: 'bg-sky-100 text-sky-800 ring-sky-200' },
  ENTREGADO: { texto: 'Entregado', clase: 'bg-green-100 text-green-800 ring-green-200' },
  CANCELADO: { texto: 'Cancelado', clase: 'bg-stone-200 text-stone-600 ring-stone-300' },
};

/** Etiqueta de color para cada uno de los cuatro estados del pedido. */
export default function BadgeEstado({ estado }: { estado: EstadoPedido }) {
  const { texto, clase } = ESTILOS[estado];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${clase}`}
    >
      {texto}
    </span>
  );
}
