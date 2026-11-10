import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Ítem del carrito. Al confirmar se envían solo producto_id y cantidad:
 *  el precio definitivo lo copia el backend del producto (RN-01). */
export interface ItemCarrito {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
}

interface CartState {
  items: ItemCarrito[];
  /** Suma una unidad (o `cantidad`) del producto; si no estaba, lo agrega. */
  agregar: (item: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void;
  quitar: (productoId: number) => void;
  /** Fija la cantidad; con 0 o menos, quita el ítem. */
  cambiarCantidad: (productoId: number, cantidad: number) => void;
  vaciar: () => void;
  total: () => number;
  cantidadTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (item, cantidad = 1) =>
        set((state) => {
          const existente = state.items.find((i) => i.producto_id === item.producto_id);
          if (existente) {
            return {
              items: state.items.map((i) =>
                i.producto_id === item.producto_id ? { ...i, cantidad: i.cantidad + cantidad } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, cantidad }] };
        }),

      quitar: (productoId) =>
        set((state) => ({ items: state.items.filter((i) => i.producto_id !== productoId) })),

      cambiarCantidad: (productoId, cantidad) =>
        set((state) => ({
          items:
            cantidad <= 0
              ? state.items.filter((i) => i.producto_id !== productoId)
              : state.items.map((i) => (i.producto_id === productoId ? { ...i, cantidad } : i)),
        })),

      vaciar: () => set({ items: [] }),

      total: () => get().items.reduce((suma, i) => suma + i.precio_unitario * i.cantidad, 0),

      cantidadTotal: () => get().items.reduce((suma, i) => suma + i.cantidad, 0),
    }),
    // persist: el carrito sobrevive a recargar la página (localStorage)
    { name: 'food-store-carrito', partialize: (state) => ({ items: state.items }) },
  ),
);
