// Tipos de pedidos: mismos nombres de campo que los schemas del backend (modules/pedidos/schemas.py).

export const ESTADOS_PEDIDO = ['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO'] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const FORMAS_PAGO = ['EFECTIVO', 'TRANSFERENCIA'] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number];

/** DetallePedidoRead: línea con nombre y precio copiados al crear el pedido. */
export interface DetallePedido {
  producto_id: number;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

/** PedidoRead */
export interface Pedido {
  id: number;
  usuario_id: number;
  estado: EstadoPedido;
  forma_pago: FormaPago;
  direccion_entrega: string;
  notas: string | null;
  total: number;
  created_at: string;
  updated_at: string;
  items: DetallePedido[];
}

/** ItemPedidoCreate */
export interface ItemPedidoCreate {
  producto_id: number;
  cantidad: number;
}

/** PedidoCreate: body de POST /pedidos */
export interface PedidoCreate {
  items: ItemPedidoCreate[];
  forma_pago: FormaPago;
  direccion_entrega: string;
  notas: string | null;
}

/** ResumenPedidos: indicadores del panel */
export interface ResumenPedidos {
  pendientes: number;
  en_preparacion: number;
  entregados: number;
  cancelados: number;
  pedidos_hoy: number;
  ingresos_entregados: number;
}
