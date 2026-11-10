import { useCallback, useMemo, useState } from 'react';
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
import ProductoList from '../components/productos/ProductoList';
import ProductoModal from '../components/productos/ProductoModal';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { columnaAcciones } from '../components/ui/columnaAcciones';
import { categoriasApi, ingredientesApi, productosApi, QUERY_KEYS } from '../api/recursos';
import type { Categoria } from '../types/categoria';
import type { Ingrediente } from '../types/ingrediente';
import type { ModoModal } from '../types/form';
import { useEsAdmin } from '../store/authStore';
import type { Producto, ProductoCreate, ProductoFormValues } from '../types/producto';
import { formatearPrecio } from '../utils/format';

const SIN_PRODUCTOS: Producto[] = [];
const SIN_CATEGORIAS: Categoria[] = [];
const SIN_INGREDIENTES: Ingrediente[] = [];
const VALORES_INICIALES: ProductoFormValues = {
  nombre: '',
  descripcion: '',
  precio_base: '',
  imagen_url: '',
  disponible: true,
  categoria_ids: [],
  ingrediente_ids: [],
};
const columnHelper = createColumnHelper<Producto>();

// Columnas fuera del componente: son estables entre renders
const columns = [
  columnHelper.accessor('nombre', {
    header: 'Producto',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.imagenes_url[0] ? (
          <img
            src={row.original.imagenes_url[0]}
            alt=""
            className="h-10 w-10 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-stone-100">
            🍽️
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-stone-800">{row.original.nombre}</p>
          {row.original.descripcion && (
            <p className="max-w-xs truncate text-xs text-stone-500">{row.original.descripcion}</p>
          )}
          {row.original.ingredientes.length > 0 && (
            <p className="max-w-xs truncate text-xs text-stone-400" title="Ingredientes">
              🧂 {row.original.ingredientes.map((i) => i.nombre).join(', ')}
            </p>
          )}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor((p) => p.categorias.map((c) => c.nombre).join(', '), {
    id: 'categorias',
    header: 'Categorías',
    enableSorting: false,
    // columnFilter: el producto pertenece a la categoría elegida
    filterFn: (row, _columnId, filterValue: number) =>
      row.original.categorias.some((c) => c.id === filterValue),
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.categorias.map((c) => (
          <span key={c.id} className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
            {c.nombre}
          </span>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor('precio_base', {
    header: 'Precio',
    cell: (info) => (
      <span className="font-semibold whitespace-nowrap text-stone-800">
        {formatearPrecio(info.getValue())}
      </span>
    ),
    enableGlobalFilter: false,
  }),
  columnHelper.accessor('disponible', {
    header: 'Estado',
    cell: (info) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
          info.getValue() ? 'bg-green-100 text-green-700' : 'bg-stone-200 text-stone-500'
        }`}
      >
        {info.getValue() ? 'Disponible' : 'No disponible'}
      </span>
    ),
    enableGlobalFilter: false,
  }),
  columnaAcciones<Producto>(),
];

/** Convierte los valores del formulario al body que espera el backend. */
const aPayload = (v: ProductoFormValues): ProductoCreate => ({
  nombre: v.nombre.trim(),
  descripcion: v.descripcion.trim() || null,
  precio_base: Number(v.precio_base.replace(',', '.')),
  imagenes_url: v.imagen_url.trim() ? [v.imagen_url.trim()] : [],
  disponible: v.disponible,
  categoria_ids: v.categoria_ids,
  ingrediente_ids: v.ingrediente_ids,
});

export default function ProductsPage() {
  const queryClient = useQueryClient();
  // Interfaz condicional por rol: sólo admin ve crear, editar y eliminar.
  // Ocultarlos no reemplaza al backend, que responde 403 a un user (RN-04).
  const esAdmin = useEsAdmin();

  // ---------- Lecturas (useQuery) ----------
  const { data, isPending, isError, error, refetch } = useQuery<Producto[], Error>({
    queryKey: QUERY_KEYS.productos,
    queryFn: productosApi.listar,
  });
  const productos = data ?? SIN_PRODUCTOS;

  // Categorías: para el filtro y para elegirlas en el formulario (misma caché que CategoriasPage)
  const { data: dataCategorias } = useQuery<Categoria[], Error>({
    queryKey: QUERY_KEYS.categorias,
    queryFn: categoriasApi.listar,
  });
  const categorias = dataCategorias ?? SIN_CATEGORIAS;

  // Ingredientes: para elegirlos en el formulario (relación ProductoIngrediente)
  const { data: dataIngredientes } = useQuery<Ingrediente[], Error>({
    queryKey: QUERY_KEYS.ingredientes,
    queryFn: ingredientesApi.listar,
  });
  const ingredientes = dataIngredientes ?? SIN_INGREDIENTES;

  // ---------- Modal (booleano con useState) ----------
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const cerrarModal = useCallback((): void => setIsModalOpen(false), []);

  // ---------- Escrituras (useMutation) ----------
  const invalidar = (): void => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productos });
  };

  const crear = useMutation<Producto, Error, ProductoCreate>({
    mutationFn: productosApi.crear,
    onSuccess: invalidar,
  });
  const actualizar = useMutation<Producto, Error, { id: number; data: ProductoCreate }>({
    mutationFn: productosApi.actualizar,
    onSuccess: invalidar,
  });
  const eliminar = useMutation<void, Error, number>({
    mutationFn: productosApi.eliminar,
    onSuccess: () => {
      invalidar();
      // Una categoría sin productos activos ya se puede eliminar
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categorias });
    },
    onError: (err) => setErrorEliminar(err.message),
  });

  // ---------- Formulario (TanStack Form) ----------
  const form = useForm({
    defaultValues: VALORES_INICIALES,
    onSubmit: async ({ value }) => {
      const datos = aPayload(value);
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

  const abrirEdicion = (producto: Producto): void => {
    setEditando(producto);
    actualizar.reset();
    // keepDefaultValues: si no, useForm vuelve a aplicar VALORES_INICIALES en el próximo render
    form.reset(
      {
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? '',
        precio_base: String(producto.precio_base),
        imagen_url: producto.imagenes_url[0] ?? '',
        disponible: producto.disponible,
        categoria_ids: producto.categorias.map((c) => c.id),
        ingrediente_ids: producto.ingredientes.map((i) => i.id),
      },
      { keepDefaultValues: true },
    );
    setIsModalOpen(true);
  };

  const confirmarEliminar = (producto: Producto): void => {
    if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return;
    setErrorEliminar(null);
    eliminar.mutate(producto.id);
  };

  // ---------- Tabla (TanStack Table) ----------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);

  // Filtro por categoría como columnFilter de la columna "categorias"
  const columnFilters = useMemo(
    () => (categoriaId === null ? [] : [{ id: 'categorias', value: categoriaId }]),
    [categoriaId],
  );

  const table = useReactTable({
    data: productos,
    columns,
    // La columna de acciones sólo existe para el admin
    state: { columnVisibility: { acciones: esAdmin }, sorting, globalFilter, columnFilters },
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
        titulo="Productos"
        descripcion={
          esAdmin
            ? 'Alta, edición y baja de productos: precio, disponibilidad y categorías'
            : 'Productos del catálogo con su precio, categorías e ingredientes (sólo lectura)'
        }
        textoBoton="Nuevo producto"
        onNuevo={esAdmin ? abrirAlta : undefined}
      />

      <div className="mb-4">
        <ErrorAlert mensaje={errorEliminar} onCerrar={() => setErrorEliminar(null)} />
      </div>

      {isPending ? (
        <LoadingState mensaje="Cargando productos…" />
      ) : isError ? (
        <ErrorState mensaje={error.message} onReintentar={() => void refetch()} />
      ) : productos.length === 0 ? (
        <EmptyState
          titulo="Todavía no hay productos"
          descripcion={
            esAdmin
              ? 'Creá el primero con el botón “Nuevo producto”.'
              : 'Un administrador todavía no cargó productos.'
          }
        />
      ) : (
        <ProductoList
          table={table}
          filtro={globalFilter}
          onFiltroChange={setGlobalFilter}
          categorias={categorias}
          categoriaId={categoriaId}
          onCategoriaChange={setCategoriaId}
        />
      )}

      <ProductoModal
        isOpen={isModalOpen}
        modo={modo}
        form={form}
        categorias={categorias}
        ingredientes={ingredientes}
        errorApi={mutacionActual.error?.message ?? null}
        onClose={cerrarModal}
      />
    </section>
  );
}
