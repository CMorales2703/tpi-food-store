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
import Confirmacion from '../../../shared/components/Confirmacion';
import DataTable from '../../../shared/components/DataTable';
import EncabezadoPagina from '../../../shared/components/EncabezadoPagina';
import EstadoError from '../../../shared/components/EstadoError';
import { SkeletonFilas } from '../../../shared/components/Skeleton';
import Button from '../../../shared/ui/Button';
import Modal from '../../../shared/ui/Modal';
import CategoriaForm from '../components/CategoriaForm';
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from '../hooks/useCategorias';
import type { Categoria, CategoriaCreate } from '../types/categoria';

const columna = createColumnHelper<Categoria>();

/** Formulario abierto: alta (null) o edición de una categoría. */
type Edicion = { categoria: Categoria | null } | null;

export default function AdminCategoriasPage() {
  const categorias = useCategorias();
  const crear = useCrearCategoria();
  const actualizar = useActualizarCategoria();
  const eliminar = useEliminarCategoria();

  const [edicion, setEdicion] = useState<Edicion>(null);
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null);
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState<SortingState>([{ id: 'nombre', desc: false }]);

  const columnas = useMemo(
    () => [
      columna.accessor('id', { header: 'ID', cell: (c) => <span className="text-stone-500">#{c.getValue()}</span> }),
      columna.accessor('nombre', {
        header: 'Nombre',
        cell: (c) => <span className="font-medium text-stone-800">{c.getValue()}</span>,
      }),
      columna.accessor('descripcion', {
        header: 'Descripción',
        enableSorting: false,
        cell: (c) => <span className="text-stone-600">{c.getValue() ?? '—'}</span>,
      }),
      columna.display({
        id: 'acciones',
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variante="secundario" tamano="sm" onClick={() => setEdicion({ categoria: row.original })}>
              Editar
            </Button>
            <Button variante="peligro" tamano="sm" onClick={() => setAEliminar(row.original)}>
              Dar de baja
            </Button>
          </div>
        ),
      }),
    ],
    [],
  );

  const tabla = useReactTable({
    data: categorias.data ?? [],
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

  const cerrarFormulario = () => {
    setEdicion(null);
    crear.reset();
    actualizar.reset();
  };

  const guardar = (datos: CategoriaCreate) =>
    edicion?.categoria
      ? actualizar.mutateAsync({ id: edicion.categoria.id, datos }).then(cerrarFormulario)
      : crear.mutateAsync(datos).then(cerrarFormulario);

  const cerrarBaja = () => {
    setAEliminar(null);
    eliminar.reset();
  };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Categorías"
        descripcion="Las categorías dadas de baja dejan de verse, pero su nombre sigue reservado."
        acciones={<Button onClick={() => setEdicion({ categoria: null })}>+ Nueva categoría</Button>}
      />

      <Buscador valor={filtro} onCambiar={setFiltro} placeholder="Buscar categoría…" />

      {categorias.isPending ? (
        <SkeletonFilas />
      ) : categorias.isError ? (
        <EstadoError error={categorias.error} onReintentar={() => void categorias.refetch()} />
      ) : (
        <DataTable table={tabla} mensajeSinResultados="No hay categorías que coincidan." />
      )}

      <Modal
        abierto={edicion !== null}
        onCerrar={cerrarFormulario}
        titulo={edicion?.categoria ? `Editar “${edicion.categoria.nombre}”` : 'Nueva categoría'}
      >
        {edicion && (
          <CategoriaForm
            categoria={edicion.categoria ?? undefined}
            onGuardar={guardar}
            onCancelar={cerrarFormulario}
            error={edicion.categoria ? actualizar.error : crear.error}
          />
        )}
      </Modal>

      <Confirmacion
        abierto={aEliminar !== null}
        titulo="Dar de baja la categoría"
        textoConfirmar="Dar de baja"
        error={eliminar.error}
        procesando={eliminar.isPending}
        onCerrar={cerrarBaja}
        onConfirmar={() => aEliminar && eliminar.mutate(aEliminar.id, { onSuccess: cerrarBaja })}
      >
        <p>
          ¿Dar de baja <strong>{aEliminar?.nombre}</strong>? Deja de aparecer en el catálogo y en
          este listado.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Sus productos siguen a la venta: si querés retirarlos, dalos de baja desde Productos.
        </p>
      </Confirmacion>
    </div>
  );
}
