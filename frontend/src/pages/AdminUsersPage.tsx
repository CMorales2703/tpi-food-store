import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import { usuariosApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import type { UsuarioPublico } from '../types/auth.types';

const SIN_DATOS: UsuarioPublico[] = [];
const QUERY_KEY = ['admin', 'usuarios'] as const;
const columnHelper = createColumnHelper<UsuarioPublico>();
const formatoFecha = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' });

/** Acciones de cada fila, que llegan a la celda por props de la columna. */
interface AccionesUsuario {
  miUsername: string | undefined;
  procesandoId: number | null;
  onCambiar: (usuario: UsuarioPublico) => void;
}

function crearColumnas({ miUsername, procesandoId, onCambiar }: AccionesUsuario) {
  return [
    columnHelper.accessor('username', {
      header: 'Usuario',
      cell: (info) => (
        <span className="font-medium text-stone-800">
          @{info.getValue()}
          {info.getValue() === miUsername && (
            <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-xs text-stone-600">
              vos
            </span>
          )}
        </span>
      ),
    }),
    columnHelper.accessor('full_name', { header: 'Nombre' }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => <span className="text-stone-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor('role', {
      header: 'Rol',
      cell: (info) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            info.getValue() === 'admin'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-stone-100 text-stone-700'
          }`}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('disabled', {
      header: 'Estado',
      enableGlobalFilter: false,
      cell: (info) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
            info.getValue() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {info.getValue() ? 'Desactivado' : 'Activo'}
        </span>
      ),
    }),
    columnHelper.accessor('created_at', {
      header: 'Alta',
      enableGlobalFilter: false,
      cell: (info) => (
        <span className="text-stone-500">{formatoFecha.format(new Date(info.getValue()))}</span>
      ),
    }),
    columnHelper.display({
      id: 'acciones',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const u = row.original;
        const esYo = u.username === miUsername;
        return (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onCambiar(u)}
              disabled={esYo || procesandoId === u.id}
              title={esYo ? 'No podés desactivar tu propia cuenta' : undefined}
              className={`rounded-md px-3 py-1 text-sm whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${
                u.disabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'border border-red-300 text-red-700 hover:bg-red-50'
              }`}
            >
              {procesandoId === u.id ? 'Guardando…' : u.disabled ? 'Activar' : 'Desactivar'}
            </button>
          </div>
        );
      },
    }),
  ];
}

/** /admin/users — sólo admin (ProtectedRoute + require_role en el backend). */
export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const miUsername = useAuthStore((s) => s.user?.username);

  const { data, isPending, isError, error, refetch } = useQuery<UsuarioPublico[], Error>({
    queryKey: QUERY_KEY,
    queryFn: usuariosApi.listar,
  });
  const usuarios = data ?? SIN_DATOS;

  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const cambiarEstado = useMutation<UsuarioPublico, Error, UsuarioPublico>({
    mutationFn: (u) => (u.disabled ? usuariosApi.activar(u.id) : usuariosApi.desactivar(u.id)),
    onMutate: () => setErrorAccion(null),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (err) => setErrorAccion(err.message),
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  const procesandoId = cambiarEstado.isPending ? (cambiarEstado.variables?.id ?? null) : null;
  const { mutate } = cambiarEstado; // función estable de TanStack Query
  const columns = useMemo(
    () => crearColumnas({ miUsername, procesandoId, onCambiar: mutate }),
    [miUsername, procesandoId, mutate],
  );

  const table = useReactTable({
    data: usuarios,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <section>
      <PageHeader
        titulo="Usuarios"
        descripcion="Activá o desactivá cuentas. Una cuenta desactivada no puede iniciar sesión."
      />

      <div className="mb-4">
        <ErrorAlert mensaje={errorAccion} onCerrar={() => setErrorAccion(null)} />
      </div>

      {isPending ? (
        <LoadingState mensaje="Cargando usuarios…" />
      ) : isError ? (
        <ErrorState mensaje={error.message} onReintentar={() => void refetch()} />
      ) : usuarios.length === 0 ? (
        <EmptyState titulo="No hay usuarios registrados" />
      ) : (
        <div className="space-y-3">
          <SearchInput
            valor={globalFilter}
            onCambio={setGlobalFilter}
            placeholder="Buscar por usuario, nombre o email…"
          />
          <DataTable
            table={table}
            mensajeSinResultados="Ningún usuario coincide con la búsqueda."
          />
        </div>
      )}
    </section>
  );
}
