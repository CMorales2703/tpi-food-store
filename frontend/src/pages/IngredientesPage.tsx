import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import IngredienteList from '../components/ingredientes/IngredienteList';
import IngredienteModal from '../components/ingredientes/IngredienteModal';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { columnaAcciones } from '../components/ui/columnaAcciones';
import { ingredientesApi, QUERY_KEYS } from '../api/recursos';
import type { ModoModal } from '../types/form';
import { useEsAdmin } from '../store/authStore';
import type { Ingrediente, IngredienteCreate, IngredienteFormValues } from '../types/ingrediente';

const SIN_DATOS: Ingrediente[] = [];
const VALORES_INICIALES: IngredienteFormValues = { nombre: '' };
const columnHelper = createColumnHelper<Ingrediente>();
const formatoFecha = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' });

// Columnas fuera del componente: son estables entre renders
const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (info) => <span className="text-stone-400">{info.getValue()}</span>,
    enableGlobalFilter: false,
  }),
  columnHelper.accessor('nombre', {
    header: 'Nombre',
    cell: (info) => <span className="font-medium text-stone-800">{info.getValue()}</span>,
  }),
  columnHelper.accessor('updated_at', {
    header: 'Última modificación',
    cell: (info) => (
      <span className="text-stone-500">{formatoFecha.format(new Date(info.getValue()))}</span>
    ),
    enableGlobalFilter: false,
  }),
  columnaAcciones<Ingrediente>(),
];

export default function IngredientesPage() {
  const queryClient = useQueryClient();
  // Interfaz condicional por rol: sólo admin ve crear, editar y eliminar.
  // Ocultarlos no reemplaza al backend, que responde 403 a un user (RN-04).
  const esAdmin = useEsAdmin();

  // ---------- Lectura (useQuery → GET /ingredientes) ----------
  const { data, isPending, isError, error, refetch } = useQuery<Ingrediente[], Error>({
    queryKey: QUERY_KEYS.ingredientes,
    queryFn: ingredientesApi.listar,
  });
  const ingredientes = data ?? SIN_DATOS;

  // ---------- Modal (booleano con useState) ----------
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editando, setEditando] = useState<Ingrediente | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const cerrarModal = useCallback((): void => setIsModalOpen(false), []);

  // ---------- Escrituras (useMutation) ----------
  const invalidar = (): void => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ingredientes });
    // Los productos muestran sus ingredientes: también se refrescan
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
  };

  const crear = useMutation<Ingrediente, Error, IngredienteCreate>({
    mutationFn: ingredientesApi.crear,
    onSuccess: invalidar,
  });
  const actualizar = useMutation<Ingrediente, Error, { id: number; data: IngredienteCreate }>({
    mutationFn: ingredientesApi.actualizar,
    onSuccess: invalidar,
  });
  const eliminar = useMutation<void, Error, number>({
    mutationFn: ingredientesApi.eliminar,
    onSuccess: invalidar,
    onError: (err) => setErrorEliminar(err.message),
  });

  // ---------- Formulario (TanStack Form) ----------
  const form = useForm({
    defaultValues: VALORES_INICIALES,
    onSubmit: async ({ value }) => {
      const datos: IngredienteCreate = { nombre: value.nombre.trim() };
      try {
        if (editando) await actualizar.mutateAsync({ id: editando.id, data: datos });
        else await crear.mutateAsync(datos);
        cerrarModal();
      } catch {
        /* el mensaje se lee de mutation.error */
      }
    },
  });

  const abrirAlta = (): void => {
    setEditando(null);
    crear.reset();
    form.reset(VALORES_INICIALES);
    setIsModalOpen(true);
  };

  const abrirEdicion = (ingrediente: Ingrediente): void => {
    setEditando(ingrediente);
    actualizar.reset();
    // keepDefaultValues: si no, useForm vuelve a aplicar VALORES_INICIALES en el próximo render
    form.reset({ nombre: ingrediente.nombre }, { keepDefaultValues: true });
    setIsModalOpen(true);
  };

  const confirmarEliminar = (ingrediente: Ingrediente): void => {
    if (!window.confirm(`¿Eliminar el ingrediente "${ingrediente.nombre}"?`)) return;
    setErrorEliminar(null);
    eliminar.mutate(ingrediente.id);
  };

  // ---------- Tabla (TanStack Table) ----------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  const table = useReactTable({
    data: ingredientes,
    columns,
    // La columna de acciones sólo existe para el admin
    state: { columnVisibility: { acciones: esAdmin }, sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
    // Acciones de cada fila (las usa columnaAcciones)
    meta: {
      onEditar: abrirEdicion,
      onEliminar: confirmarEliminar,
      eliminandoId: eliminar.isPending ? (eliminar.variables ?? null) : null,
    },
  });

  const mutacionActual = editando ? actualizar : crear;
  const modo: ModoModal = editando ? 'edicion' : 'alta';

  return (
    <section>
      <PageHeader
        titulo="Ingredientes"
        descripcion={
          esAdmin
            ? 'Alta, edición y baja de los ingredientes'
            : 'Ingredientes disponibles (sólo lectura)'
        }
        textoBoton="Nuevo ingrediente"
        onNuevo={esAdmin ? abrirAlta : undefined}
      />

      <div className="mb-4">
        <ErrorAlert mensaje={errorEliminar} onCerrar={() => setErrorEliminar(null)} />
      </div>

      {isPending ? (
        <LoadingState mensaje="Cargando ingredientes…" />
      ) : isError ? (
        <ErrorState mensaje={error.message} onReintentar={() => void refetch()} />
      ) : ingredientes.length === 0 ? (
        <EmptyState
          titulo="Todavía no hay ingredientes"
          descripcion={
            esAdmin
              ? 'Creá el primero con el botón “Nuevo ingrediente”.'
              : 'Un administrador todavía no cargó ingredientes.'
          }
        />
      ) : (
        <IngredienteList table={table} filtro={globalFilter} onFiltroChange={setGlobalFilter} />
      )}

      <IngredienteModal
        isOpen={isModalOpen}
        modo={modo}
        form={form}
        errorApi={mutacionActual.error?.message ?? null}
        onClose={cerrarModal}
      />
    </section>
  );
}
