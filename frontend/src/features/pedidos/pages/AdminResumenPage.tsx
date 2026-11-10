import { Link } from 'react-router-dom';
import EncabezadoPagina from '../../../shared/components/EncabezadoPagina';
import EstadoError from '../../../shared/components/EstadoError';
import { Skeleton } from '../../../shared/components/Skeleton';
import Button from '../../../shared/ui/Button';
import { formatearPrecio } from '../../../shared/utils/format';
import TarjetaResumen from '../components/TarjetaResumen';
import { useResumenPedidos } from '../hooks/usePedidos';

export default function AdminResumenPage() {
  const resumen = useResumenPedidos();

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Resumen"
        descripcion="Indicadores del negocio."
        acciones={
          <Button variante="secundario" onClick={() => void resumen.refetch()} cargando={resumen.isFetching} textoCargando="Actualizando…">
            Actualizar
          </Button>
        }
      />

      {resumen.isPending ? (
        <div role="status" aria-label="Cargando" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : resumen.isError ? (
        <EstadoError error={resumen.error} onReintentar={() => void resumen.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TarjetaResumen titulo="Ingresos (entregados)" valor={formatearPrecio(resumen.data.ingresos_entregados)} icono="💰" acento="border-l-green-500" />
            <TarjetaResumen titulo="Pedidos de hoy" valor={resumen.data.pedidos_hoy} icono="📅" acento="border-l-orange-500" />
            <TarjetaResumen titulo="Pendientes" valor={resumen.data.pendientes} icono="⏳" acento="border-l-amber-400" />
            <TarjetaResumen titulo="En preparación" valor={resumen.data.en_preparacion} icono="👨‍🍳" acento="border-l-sky-500" />
            <TarjetaResumen titulo="Entregados" valor={resumen.data.entregados} icono="✅" acento="border-l-green-500" />
            <TarjetaResumen titulo="Cancelados" valor={resumen.data.cancelados} icono="✖️" acento="border-l-stone-400" />
          </div>
          {resumen.data.pendientes > 0 && (
            <p className="text-sm text-stone-600">
              Hay {resumen.data.pendientes} pedido{resumen.data.pendientes === 1 ? '' : 's'} esperando.{' '}
              <Link to="/admin/pedidos" className="font-medium text-orange-700 hover:underline">
                Ir a pedidos ›
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
