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
import CategoriaList from '../components/categorias/CategoriaList';
import CategoriaModal from '../components/categorias/CategoriaModal';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { columnaAcciones } from '../components/ui/columnaAcciones';
import { categoriasApi, QUERY_KEYS } from '../api/recursos';
import type { Categoria, CategoriaCreate, CategoriaFormValues } from '../types/categoria';
import type { ModoModal } from '../types/form';
import { useEsAdmin } from '../store/authStore';

const SIN_DATOS: Categoria[] = [];
const VALORES_INICIALES: CategoriaFormValues = { nombre: '', descripcion: '' };
const columnHelper = createColumnHelper<Categoria>();

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
  columnHelper.accessor('descripcion', {
    header: 'Descripción',
    cell: (info) =>
      info.getValue() ? (
        <span className="text-stone-600">{info.getValue()}</span>
      ) : (
        <span className="text-stone-400 italic">Sin descripción</span>
      ),
  }),
  columnaAcciones<Categoria>(),
];

export default function CategoriasPage() {
  const queryClient = useQueryClient();
  // Interfaz condicional por rol: sólo admin ve crear, editar y eliminar.
  // Ocultarlos no reemplaza al backend, que responde 403 a un user (RN-04).
  const esAdmin = useEsAdmin();

  // ---------- Lectura (useQuery → GET /categorias) ----------
  const { data, isPending, isError, error, refetch } = useQuery<Categoria[], Error>({
    queryKey: QUERY_KEYS.categorias,
    queryFn: categoriasApi.listar,
  });
  const categorias = data ?? SIN_DATOS;

  // ---------- Modal (booleano con useState) ----------
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const cerrarModal = useCallback((): void => setIsModalOpen(false), []);

  // ---------- Escrituras (useMutation) ----------
  const invalidar = (): void => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categorias });
    // Los productos muestran sus categorías: también se refrescan
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
  };

  const crear = useMutation<Categoria, Error, CategoriaCreate>({
    mutationFn: categoriasApi.crear,
    onSuccess: invalidar,
  });
  const actualizar = useMutation<Categoria, Error, { id: number; data: CategoriaCreate }>({
    mutationFn: categoriasApi.actualizar,
    onSuccess: invalidar,
  });
  const eliminar = useMutation<void, Error, number>({
    mutationFn: categoriasApi.eliminar,
    onSuccess: invalidar,
    onError: (err) => setErrorEliminar(err.message), // p. ej. 409 si tiene productos
  });

  // ---------- Formulario (TanStack Form) ----------
  const form = useForm({
    defaultValues: VALORES_INICIALES,
    onSubmit: async ({ value }) => {
      const datos: CategoriaCreate = {
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim(),
      };
      try {
        if (editando) await actualizar.mutateAsync({ id: editando.id, data: datos });
        else await crear.mutateAsync(datos);
        cerrarModal(); // al éxito se cierra; si falla, el error queda visible en el modal
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

  const abrirEdicion = (categoria: Categoria): void => {
    setEditando(categoria);
    actualizar.reset();
    // keepDefaultValues: si no, useForm vuelve a aplicar VALORES_INICIALES en el próximo render
    form.reset(
      { nombre: categoria.nombre, descripcion: categoria.descripcion },
      { keepDefaultValues: true },
    );
    setIsModalOpen(true);
  };

  const confirmarEliminar = (categoria: Categoria): void => {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;
    setErrorEliminar(null);
    eliminar.mutate(categoria.id);
  };

  // ---------- Tabla (TanStack Table) ----------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  const table = useReactTable({
    data: categorias,
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
        titulo="Categorías"
        descripcion={
          esAdmin
            ? 'Alta, edición y baja de las categorías del catálogo'
            : 'Categorías del catálogo (sólo lectura)'
        }
        textoBoton="Nueva categoría"
        onNuevo={esAdmin ? abrirAlta : undefined}
      />

      <div className="mb-4">
        <ErrorAlert mensaje={errorEliminar} onCerrar={() => setErrorEliminar(null)} />
      </div>

      {isPending ? (
        <LoadingState mensaje="Cargando categorías…" />
      ) : isError ? (
        <ErrorState mensaje={error.message} onReintentar={() => void refetch()} />
      ) : categorias.length === 0 ? (
        <EmptyState
          titulo="Todavía no hay categorías"
          descripcion={
            esAdmin
              ? 'Creá la primera con el botón “Nueva categoría”.'
              : 'Un administrador todavía no cargó categorías.'
          }
        />
      ) : (
        <CategoriaList table={table} filtro={globalFilter} onFiltroChange={setGlobalFilter} />
      )}

      <CategoriaModal
        isOpen={isModalOpen}
        modo={modo}
        form={form}
        errorApi={mutacionActual.error?.message ?? null}
        onClose={cerrarModal}
      />
    </section>
  );
}
