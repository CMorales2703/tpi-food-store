import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import Buscador from '../../../shared/components/Buscador';
import DataTable from '../../../shared/components/DataTable';
import EncabezadoPagina from '../../../shared/components/EncabezadoPagina';
import EstadoError from '../../../shared/components/EstadoError';
import MensajeError from '../../../shared/components/MensajeError';
import { SkeletonFilas } from '../../../shared/components/Skeleton';
import Button from '../../../shared/ui/Button';
import { formatearFecha } from '../../../shared/utils/format';
import { useAuthStore } from '../../../store/authStore';
import type { UserPublic } from '../../auth/types/auth';
import { useCambiarEstadoUsuario, useUsuarios } from '../hooks/useUsuarios';

const columna = createColumnHelper<UserPublic>();

export default function AdminUsuariosPage() {
  const usuarios = useUsuarios();
  const cambiarEstado = useCambiarEstadoUsuario();
  const miId = useAuthStore((s) => s.usuario?.id);
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState<SortingState>([{ id: 'username', desc: false }]);

  // id del usuario que se está activando / desactivando (para deshabilitar solo su botón)
  const procesandoId = cambiarEstado.isPending ? cambiarEstado.variables.id : null;

  const columnas = useMemo(
    () => [
      columna.accessor('username', {
        header: 'Usuario',
        cell: (c) => <span className="font-medium text-stone-800">@{c.getValue()}</span>,
      }),
      columna.accessor('full_name', { header: 'Nombre' }),
      columna.accessor('email', { header: 'Email' }),
      columna.accessor('role', {
        header: 'Rol',
        cell: (c) =>
          c.getValue() === 'admin' ? (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
              Admin
            </span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
              Cliente
            </span>
          ),
      }),
      columna.accessor('disabled', {
        header: 'Estado',
        cell: (c) =>
          c.getValue() ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              Desactivado
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
              Activo
            </span>
          ),
      }),
      columna.accessor('created_at', {
        header: 'Alta',
        cell: (c) => <span className="text-stone-500">{formatearFecha(c.getValue())}</span>,
      }),
      columna.display({
        id: 'acciones',
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => {
          const u = row.original;
          // El admin no puede desactivarse a sí mismo: en su fila no hay botón
          if (u.id === miId) return <span className="text-xs text-stone-400">Tu cuenta</span>;
          return u.disabled ? (
            <Button
              variante="secundario"
              tamano="sm"
              cargando={procesandoId === u.id}
              textoCargando="Activando…"
              onClick={() => cambiarEstado.mutate({ id: u.id, activar: true })}
            >
              Activar
            </Button>
          ) : (
            <Button
              variante="peligro"
              tamano="sm"
              cargando={procesandoId === u.id}
              textoCargando="Desactivando…"
              onClick={() => cambiarEstado.mutate({ id: u.id, activar: false })}
            >
              Desactivar
            </Button>
          );
        },
      }),
    ],
    [miId, procesandoId, cambiarEstado],
  );

  const tabla = useReactTable({
    data: usuarios.data ?? [],
    columns: columnas,
    state: { globalFilter: filtro, sorting: orden },
    onGlobalFilterChange: setFiltro,
    onSortingChange: setOrden,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Un usuario desactivado no puede iniciar sesión ni usar su sesión abierta."
      />

      <Buscador valor={filtro} onCambiar={setFiltro} placeholder="Buscar por usuario, nombre o email…" />

      <MensajeError error={cambiarEstado.error} />

      {usuarios.isPending ? (
        <SkeletonFilas />
      ) : usuarios.isError ? (
        <EstadoError error={usuarios.error} onReintentar={() => void usuarios.refetch()} />
      ) : (
        <DataTable table={tabla} mensajeSinResultados="No hay usuarios que coincidan." />
      )}
    </div>
  );
}
