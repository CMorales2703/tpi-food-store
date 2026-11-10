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
import { formatearPrecio } from '../../../shared/utils/format';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import ProductoForm from '../components/ProductoForm';
import StockForm from '../components/StockForm';
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from '../hooks/useProductos';
import type { Producto, ProductoCreate, ProductoStockUpdate } from '../types/producto';

const columna = createColumnHelper<Producto>();

type Edicion = { producto: Producto | null } | null;

export default function AdminProductosPage() {
  // El panel pide hasta 100 productos y pagina del lado del cliente con TanStack Table
  const productos = useProductos({ skip: 0, limit: 100 });
  const categorias = useCategorias();
  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();
  const cambiarStock = useActualizarStock();
  const eliminar = useEliminarProducto();

  const [edicion, setEdicion] = useState<Edicion>(null);
  const [enStock, setEnStock] = useState<Producto | null>(null);
  const [aEliminar, setAEliminar] = useState<Producto | null>(null);
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState<SortingState>([{ id: 'nombre', desc: false }]);

  const columnas = useMemo(
    () => [
      columna.accessor('nombre', {
        header: 'Producto',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-stone-800">{row.original.nombre}</p>
            <p className="text-xs text-stone-500">{row.original.categoria.nombre}</p>
          </div>
        ),
      }),
      // Columna oculta: permite que el buscador encuentre por categoría
      columna.accessor((p) => p.categoria.nombre, { id: 'categoria', header: 'Categoría' }),
      columna.accessor('precio_base', {
        header: 'Precio',
        cell: (c) => formatearPrecio(c.getValue()),
      }),
      columna.accessor('stock', {
        header: 'Stock',
        cell: (c) => (
          <span className={c.getValue() === 0 ? 'font-semibold text-red-600' : c.getValue() <= 5 ? 'font-semibold text-amber-700' : ''}>
            {c.getValue()}
          </span>
        ),
      }),
      columna.accessor('disponible', {
        header: 'Estado',
        cell: (c) =>
          c.getValue() ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
              Disponible
            </span>
          ) : (
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">
              No disponible
            </span>
          ),
      }),
      columna.display({
        id: 'acciones',
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variante="secundario" tamano="sm" onClick={() => setEnStock(row.original)}>
              Stock
            </Button>
            <Button variante="secundario" tamano="sm" onClick={() => setEdicion({ producto: row.original })}>
              Editar
            </Button>
            <Button variante="peligro" tamano="sm" onClick={() => setAEliminar(row.original)}>
              Baja
            </Button>
          </div>
        ),
      }),
    ],
    [],
  );

  const tabla = useReactTable({
    data: productos.data?.items ?? [],
    columns: columnas,
    state: { globalFilter: filtro, sorting: orden, columnVisibility: { categoria: false } },
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

  const guardar = (datos: ProductoCreate) =>
    edicion?.producto
      ? actualizar.mutateAsync({ id: edicion.producto.id, datos }).then(cerrarFormulario)
      : crear.mutateAsync(datos).then(cerrarFormulario);

  const cerrarStock = () => {
    setEnStock(null);
    cambiarStock.reset();
  };

  const guardarStock = (datos: ProductoStockUpdate) =>
    enStock ? cambiarStock.mutateAsync({ id: enStock.id, datos }).then(cerrarStock) : Promise.resolve();

  const cerrarBaja = () => {
    setAEliminar(null);
    eliminar.reset();
  };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Productos"
        descripcion="Alta, edición, stock y baja de los productos del catálogo."
        acciones={
          <Button onClick={() => setEdicion({ producto: null })} disabled={!categorias.data?.length}>
            + Nuevo producto
          </Button>
        }
      />

      <Buscador valor={filtro} onCambiar={setFiltro} placeholder="Buscar por nombre o categoría…" />

      {productos.isPending ? (
        <SkeletonFilas />
      ) : productos.isError ? (
        <EstadoError error={productos.error} onReintentar={() => void productos.refetch()} />
      ) : (
        <DataTable table={tabla} mensajeSinResultados="No hay productos que coincidan." />
      )}

      <Modal
        abierto={edicion !== null}
        onCerrar={cerrarFormulario}
        titulo={edicion?.producto ? `Editar “${edicion.producto.nombre}”` : 'Nuevo producto'}
        ancho="lg"
      >
        {edicion && (
          <ProductoForm
            producto={edicion.producto ?? undefined}
            categorias={categorias.data ?? []}
            onGuardar={guardar}
            onCancelar={cerrarFormulario}
            error={edicion.producto ? actualizar.error : crear.error}
          />
        )}
      </Modal>

      <Modal abierto={enStock !== null} onCerrar={cerrarStock} titulo={`Stock de “${enStock?.nombre ?? ''}”`}>
        {enStock && (
          <StockForm
            producto={enStock}
            onGuardar={guardarStock}
            onCancelar={cerrarStock}
            error={cambiarStock.error}
          />
        )}
      </Modal>

      <Confirmacion
        abierto={aEliminar !== null}
        titulo="Dar de baja el producto"
        textoConfirmar="Dar de baja"
        error={eliminar.error}
        procesando={eliminar.isPending}
        onCerrar={cerrarBaja}
        onConfirmar={() => aEliminar && eliminar.mutate(aEliminar.id, { onSuccess: cerrarBaja })}
      >
        <p>
          ¿Dar de baja <strong>{aEliminar?.nombre}</strong>? Deja de aparecer en el catálogo. Los
          pedidos que ya lo incluyen no cambian.
        </p>
      </Confirmacion>
    </div>
  );
}
