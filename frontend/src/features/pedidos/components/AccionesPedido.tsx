import Button from '../../../shared/ui/Button';
import type { EstadoPedido, Pedido } from '../types/pedido';

/** Botones del admin según la máquina de estados (RN-02). Los terminales no tienen acciones. */
const SIGUIENTE: Partial<Record<EstadoPedido, { estado: EstadoPedido; texto: string }>> = {
  PENDIENTE: { estado: 'EN_PREPARACION', texto: 'Preparar' },
  EN_PREPARACION: { estado: 'ENTREGADO', texto: 'Entregar' },
};

const CANCELABLE: EstadoPedido[] = ['PENDIENTE', 'EN_PREPARACION'];

interface AccionesPedidoProps {
  pedido: Pedido;
  procesando: boolean;
  onAvanzar: (pedido: Pedido, estado: EstadoPedido) => void;
  onCancelar: (pedido: Pedido) => void;
}

export default function AccionesPedido({ pedido, procesando, onAvanzar, onCancelar }: AccionesPedidoProps) {
  const siguiente = SIGUIENTE[pedido.estado];
  if (!siguiente && !CANCELABLE.includes(pedido.estado)) {
    return <span className="text-xs text-stone-400">—</span>;
  }
  return (
    <div className="flex justify-end gap-2">
      {siguiente && (
        <Button
          tamano="sm"
          cargando={procesando}
          textoCargando="…"
          onClick={() => onAvanzar(pedido, siguiente.estado)}
        >
          {siguiente.texto}
        </Button>
      )}
      {CANCELABLE.includes(pedido.estado) && (
        <Button variante="secundario" tamano="sm" disabled={procesando} onClick={() => onCancelar(pedido)}>
          Cancelar
        </Button>
      )}
    </div>
  );
}
