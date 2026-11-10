import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import EstadoError from '../../../shared/components/EstadoError';
import EstadoVacio from '../../../shared/components/EstadoVacio';
import MensajeError from '../../../shared/components/MensajeError';
import Paginacion from '../../../shared/components/Paginacion';
import { SkeletonFilas } from '../../../shared/components/Skeleton';
import BadgeEstado from '../../../shared/ui/BadgeEstado';
import Button from '../../../shared/ui/Button';
import Card from '../../../shared/ui/Card';
import Modal from '../../../shared/ui/Modal';
import { formatearFecha, formatearPrecio } from '../../../shared/utils/format';
import FiltroEstado from '../components/FiltroEstado';
import PedidoDetalle from '../components/PedidoDetalle';
import { useCancelarPedido, usePedidos } from '../hooks/usePedidos';
import type { EstadoPedido, Pedido } from '../types/pedido';

const POR_PAGINA = 10;

export default function MisPedidosPage() {
  const pedidoNuevo = (useLocation().state as { pedidoNuevo?: number } | null)?.pedidoNuevo;
  const [pagina, setPagina] = useState(0);
  const [estado, setEstado] = useState<EstadoPedido | undefined>(undefined);
  const [abierto, setAbierto] = useState<number | null>(pedidoNuevo ?? null);
  const [aCancelar, setACancelar] = useState<Pedido | null>(null);

  const pedidos = usePedidos({ skip: pagina * POR_PAGINA, limit: POR_PAGINA, estado });
  const cancelar = useCancelarPedido();

  const cambiarEstado = (nuevo: EstadoPedido | undefined) => {
    setEstado(nuevo);
    setPagina(0);
  };

  const confirmarCancelacion = () => {
    if (!aCancelar) return;
    cancelar.mutate(aCancelar.id, { onSuccess: () => setACancelar(null) });
  };

  const cerrarModal = () => {
    setACancelar(null);
    cancelar.reset();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Mis pedidos</h1>

      {pedidoNuevo && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          ✓ ¡Pedido #{pedidoNuevo} confirmado! Te avisamos cuando empiece a prepararse.
        </p>
      )}

      <FiltroEstado valor={estado} onCambiar={cambiarEstado} />

      {pedidos.isPending ? (
        <SkeletonFilas />
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onReintentar={() => void pedidos.refetch()} />
      ) : pedidos.data.total === 0 ? (
        <EstadoVacio
          icono="🧾"
          titulo={estado ? 'No tenés pedidos en este estado' : 'Todavía no hiciste pedidos'}
          accion={
            !estado && (
              <Link
                to="/"
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Ir al catálogo
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className={`space-y-3 ${pedidos.isPlaceholderData ? 'opacity-60' : ''}`}>
            {pedidos.data.items.map((pedido) => {
              const expandido = abierto === pedido.id;
              return (
                <Card
                  key={pedido.id}
                  className={pedido.id === pedidoNuevo ? 'ring-2 ring-green-300' : ''}
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                    <div className="min-w-32 flex-1">
                      <p className="font-semibold text-stone-800">Pedido #{pedido.id}</p>
                      <p className="text-xs text-stone-500">{formatearFecha(pedido.created_at)}</p>
                    </div>
                    <BadgeEstado estado={pedido.estado} />
                    <p className="w-20 text-sm text-stone-500">
                      {pedido.items.length} producto{pedido.items.length === 1 ? '' : 's'}
                    </p>
                    <p className="w-28 text-right font-bold text-stone-900">
                      {formatearPrecio(pedido.total)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variante="secundario"
                        tamano="sm"
                        aria-expanded={expandido}
                        onClick={() => setAbierto(expandido ? null : pedido.id)}
                      >
                        {expandido ? 'Ocultar' : 'Ver detalle'}
                      </Button>
                      {/* RN-04: el cliente solo cancela en PENDIENTE */}
                      {pedido.estado === 'PENDIENTE' && (
                        <Button variante="peligro" tamano="sm" onClick={() => setACancelar(pedido)}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                  {expandido && (
                    <div className="border-t border-stone-100 p-4">
                      <PedidoDetalle pedido={pedido} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          <Paginacion
            pagina={pagina}
            total={pedidos.data.total}
            porPagina={POR_PAGINA}
            onCambiar={setPagina}
          />
        </>
      )}

      <Modal abierto={aCancelar !== null} onCerrar={cerrarModal} titulo="Cancelar pedido">
        <div className="space-y-4">
          <p className="text-stone-700">
            ¿Querés cancelar el pedido #{aCancelar?.id} por{' '}
            <strong>{aCancelar && formatearPrecio(aCancelar.total)}</strong>? No se puede deshacer.
          </p>
          <MensajeError error={cancelar.error} />
          <div className="flex justify-end gap-2">
            <Button variante="secundario" onClick={cerrarModal}>
              Volver
            </Button>
            <Button
              variante="peligro"
              cargando={cancelar.isPending}
              textoCargando="Cancelando…"
              onClick={confirmarCancelacion}
            >
              Sí, cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
