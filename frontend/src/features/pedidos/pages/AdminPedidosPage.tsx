import { useMemo, useState } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Confirmacion from '../../../shared/components/Confirmacion';
import DataTable from '../../../shared/components/DataTable';
import EncabezadoPagina from '../../../shared/components/EncabezadoPagina';
import EstadoError from '../../../shared/components/EstadoError';
import MensajeError from '../../../shared/components/MensajeError';
import Paginacion from '../../../shared/components/Paginacion';
import { SkeletonFilas } from '../../../shared/components/Skeleton';
import BadgeEstado from '../../../shared/ui/BadgeEstado';
import Button from '../../../shared/ui/Button';
import Modal from '../../../shared/ui/Modal';
import { formatearFecha, formatearPrecio } from '../../../shared/utils/format';
import { useUsuarios } from '../../usuarios/hooks/useUsuarios';
import AccionesPedido from '../components/AccionesPedido';
import FiltroEstado from '../components/FiltroEstado';
import PedidoDetalle from '../components/PedidoDetalle';
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos';
import type { EstadoPedido, Pedido } from '../types/pedido';

const POR_PAGINA = 20;
const columna = createColumnHelper<Pedido>();

export default function AdminPedidosPage() {
  const [pagina, setPagina] = useState(0);
  const [estado, setEstado] = useState<EstadoPedido | undefined>(undefined);
  const [detalle, setDetalle] = useState<Pedido | null>(null);
  const [aCancelar, setACancelar] = useState<Pedido | null>(null);

  // Paginación y filtro por estado en el servidor
  const pedidos = usePedidos({ skip: pagina * POR_PAGINA, limit: POR_PAGINA, estado });
  const usuarios = useUsuarios(); // para mostrar el nombre del cliente de cada pedido
  const cambiarEstado = useCambiarEstadoPedido();

  const nombreCliente = useMemo(() => {
    const porId = new Map(usuarios.data?.map((u) => [u.id, u.full_name]) ?? []);
    return (id: number): string => porId.get(id) ?? `Usuario #${id}`;
  }, [usuarios.data]);

  const procesandoId = cambiarEstado.isPending ? cambiarEstado.variables.id : null;

  const columnas = useMemo(
    () => [
      columna.accessor('id', {
        header: 'Pedido',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-stone-800">#{row.original.id}</p>
            <p className="text-xs text-stone-500">{formatearFecha(row.original.created_at)}</p>
          </div>
        ),
      }),
      columna.accessor('usuario_id', {
        header: 'Cliente',
        cell: (c) => nombreCliente(c.getValue()),
      }),
      columna.accessor('items', {
        header: 'Productos',
        cell: (c) => c.getValue().reduce((suma, i) => suma + i.cantidad, 0),
      }),
      columna.accessor('total', {
        header: 'Total',
        cell: (c) => <span className="font-semibold">{formatearPrecio(c.getValue())}</span>,
      }),
      columna.accessor('estado', { header: 'Estado', cell: (c) => <BadgeEstado estado={c.getValue()} /> }),
      columna.display({
        id: 'acciones',
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variante="fantasma" tamano="sm" onClick={() => setDetalle(row.original)}>
              Ver
            </Button>
            <AccionesPedido
              pedido={row.original}
              procesando={procesandoId === row.original.id}
              onAvanzar={(p, nuevo) => cambiarEstado.mutate({ id: p.id, estado: nuevo })}
              onCancelar={setACancelar}
            />
          </div>
        ),
      }),
    ],
    [nombreCliente, procesandoId, cambiarEstado],
  );

  const tabla = useReactTable({
    data: pedidos.data?.items ?? [],
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // la página la trae el servidor
    enableSorting: false, // el orden también lo define el servidor (más nuevos primero)
  });

  const cambiarFiltro = (nuevo: EstadoPedido | undefined) => {
    setEstado(nuevo);
    setPagina(0);
  };

  const cerrarCancelacion = () => {
    setACancelar(null);
    cambiarEstado.reset();
  };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Pedidos"
        descripcion="Avanzá o cancelá los pedidos según su estado. Al cancelar se restituye el stock."
      />

      <FiltroEstado valor={estado} onCambiar={cambiarFiltro} />

      {!aCancelar && <MensajeError error={cambiarEstado.error} />}

      {pedidos.isPending ? (
        <SkeletonFilas />
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onReintentar={() => void pedidos.refetch()} />
      ) : (
        <div className={`space-y-4 ${pedidos.isPlaceholderData ? 'opacity-60' : ''}`}>
          <DataTable
            table={tabla}
            paginar={false}
            mensajeSinResultados={estado ? 'No hay pedidos en este estado.' : 'Todavía no hay pedidos.'}
          />
          <Paginacion
            pagina={pagina}
            total={pedidos.data.total}
            porPagina={POR_PAGINA}
            onCambiar={setPagina}
          />
        </div>
      )}

      <Modal
        abierto={detalle !== null}
        onCerrar={() => setDetalle(null)}
        titulo={detalle ? `Pedido #${detalle.id} · ${nombreCliente(detalle.usuario_id)}` : ''}
        ancho="lg"
      >
        {detalle && (
          <div className="space-y-4">
            <BadgeEstado estado={detalle.estado} />
            <PedidoDetalle pedido={detalle} />
          </div>
        )}
      </Modal>

      <Confirmacion
        abierto={aCancelar !== null}
        titulo="Cancelar pedido"
        textoConfirmar="Sí, cancelar"
        error={cambiarEstado.error}
        procesando={cambiarEstado.isPending}
        onCerrar={cerrarCancelacion}
        onConfirmar={() =>
          aCancelar &&
          cambiarEstado.mutate({ id: aCancelar.id, estado: 'CANCELADO' }, { onSuccess: cerrarCancelacion })
        }
      >
        <p>
          ¿Cancelar el pedido #{aCancelar?.id} de {aCancelar && nombreCliente(aCancelar.usuario_id)}?
          El stock de sus productos se restituye y no se puede deshacer.
        </p>
      </Confirmacion>
    </div>
  );
}
