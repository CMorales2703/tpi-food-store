import { useState, type FormEvent } from 'react';
import EstadoError from '../../../shared/components/EstadoError';
import EstadoVacio from '../../../shared/components/EstadoVacio';
import Paginacion from '../../../shared/components/Paginacion';
import { SkeletonTarjetas } from '../../../shared/components/Skeleton';
import Button from '../../../shared/ui/Button';
import { useCartStore } from '../../../store/cartStore';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import ProductoCard from '../components/ProductoCard';
import { useProductos } from '../hooks/useProductos';
import type { Producto } from '../types/producto';

const POR_PAGINA = 8;

const claseChip = (activa: boolean): string =>
  `rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
    activa
      ? 'border-orange-600 bg-orange-600 text-white'
      : 'border-stone-300 bg-white text-stone-700 hover:border-orange-400'
  }`;

export default function CatalogoPage() {
  const [pagina, setPagina] = useState(0);
  const [texto, setTexto] = useState(''); // lo que se escribe
  const [busqueda, setBusqueda] = useState(''); // lo que se busca (al enviar)
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);

  // Paginación en el servidor: skip = página × limit
  const productos = useProductos({
    skip: pagina * POR_PAGINA,
    limit: POR_PAGINA,
    search: busqueda || undefined,
    categoria_id: categoriaId,
  });
  const categorias = useCategorias();

  const itemsCarrito = useCartStore((s) => s.items);
  const agregar = useCartStore((s) => s.agregar);

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    setBusqueda(texto.trim());
    setPagina(0); // un filtro nuevo vuelve a la primera página
  };

  const elegirCategoria = (id: number | undefined) => {
    setCategoriaId(id);
    setPagina(0);
  };

  const limpiarFiltros = () => {
    setTexto('');
    setBusqueda('');
    setCategoriaId(undefined);
    setPagina(0);
  };

  const agregarAlCarrito = (producto: Producto) =>
    agregar({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_unitario: producto.precio_base,
    });

  const cantidadEnCarrito = (productoId: number): number =>
    itemsCarrito.find((i) => i.producto_id === productoId)?.cantidad ?? 0;

  const hayFiltros = busqueda !== '' || categoriaId !== undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Nuestro menú</h1>
        <p className="text-stone-500">Elegí tus platos y armá el pedido.</p>
      </div>

      <div className="space-y-3">
        <form onSubmit={buscar} className="flex gap-2" role="search">
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre…"
            aria-label="Buscar productos"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
          />
          <Button type="submit">Buscar</Button>
        </form>

        <div className="flex flex-wrap gap-2" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={claseChip(categoriaId === undefined)}
            onClick={() => elegirCategoria(undefined)}
          >
            Todas
          </button>
          {categorias.data?.map((c) => (
            <button
              key={c.id}
              type="button"
              className={claseChip(categoriaId === c.id)}
              onClick={() => elegirCategoria(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {productos.isPending ? (
        <SkeletonTarjetas cantidad={POR_PAGINA} />
      ) : productos.isError ? (
        <EstadoError error={productos.error} onReintentar={() => void productos.refetch()} />
      ) : productos.data.total === 0 ? (
        <EstadoVacio
          icono="🔍"
          titulo={hayFiltros ? 'No encontramos productos con esos filtros' : 'Todavía no hay productos'}
          descripcion={hayFiltros ? 'Probá con otra búsqueda o categoría.' : undefined}
          accion={
            hayFiltros && (
              <Button variante="secundario" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            )
          }
        />
      ) : (
        <>
          {busqueda && (
            <p className="text-sm text-stone-500">
              {productos.data.total} resultado{productos.data.total === 1 ? '' : 's'} para “
              {busqueda}”
            </p>
          )}
          <div
            className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
              productos.isPlaceholderData ? 'opacity-60' : ''
            }`}
          >
            {productos.data.items.map((p) => (
              <ProductoCard
                key={p.id}
                producto={p}
                enCarrito={cantidadEnCarrito(p.id)}
                onAgregar={agregarAlCarrito}
              />
            ))}
          </div>
          <Paginacion
            pagina={pagina}
            total={productos.data.total}
            porPagina={POR_PAGINA}
            onCambiar={setPagina}
          />
        </>
      )}
    </div>
  );
}
