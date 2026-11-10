import { ESTADOS_PEDIDO, type EstadoPedido } from '../types/pedido';

const ETIQUETA: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendientes',
  EN_PREPARACION: 'En preparación',
  ENTREGADO: 'Entregados',
  CANCELADO: 'Cancelados',
};

interface FiltroEstadoProps {
  valor: EstadoPedido | undefined;
  onCambiar: (estado: EstadoPedido | undefined) => void;
}

/** Chips para filtrar pedidos por estado (undefined = todos). */
export default function FiltroEstado({ valor, onCambiar }: FiltroEstadoProps) {
  const clase = (activo: boolean): string =>
    `rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
      activo
        ? 'border-orange-600 bg-orange-600 text-white'
        : 'border-stone-300 bg-white text-stone-700 hover:border-orange-400'
    }`;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Filtrar por estado">
      <button type="button" className={clase(valor === undefined)} onClick={() => onCambiar(undefined)}>
        Todos
      </button>
      {ESTADOS_PEDIDO.map((estado) => (
        <button
          key={estado}
          type="button"
          className={clase(valor === estado)}
          onClick={() => onCambiar(estado)}
        >
          {ETIQUETA[estado]}
        </button>
      ))}
    </div>
  );
}
