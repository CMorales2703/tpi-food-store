import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { Paginado } from '../../../shared/types/api';
import type { EstadoPedido, Pedido, PedidoCreate, ResumenPedidos } from '../types/pedido';

export interface FiltrosPedidos {
  skip: number;
  limit: number;
  estado?: EstadoPedido;
}

/** POST /pedidos — RN-01: el backend copia precios, descuenta stock y calcula el total. */
export async function crearPedido(datos: PedidoCreate): Promise<Pedido> {
  return (await axiosInstance.post<Pedido>('/pedidos', datos)).data;
}

/** GET /pedidos — los propios (user) o todos (admin). */
export async function listarPedidos(filtros: FiltrosPedidos): Promise<Paginado<Pedido>> {
  const params = Object.fromEntries(
    Object.entries(filtros).filter(([, valor]) => valor !== undefined),
  );
  return (await axiosInstance.get<Paginado<Pedido>>('/pedidos', { params })).data;
}

/** PATCH /pedidos/{id}/cancelar — el dueño, solo en PENDIENTE (RN-03, RN-04). */
export async function cancelarPedido(id: number): Promise<Pedido> {
  return (await axiosInstance.patch<Pedido>(`/pedidos/${id}/cancelar`)).data;
}

/** PATCH /pedidos/{id}/estado — admin, según la máquina de estados (RN-02). */
export async function cambiarEstadoPedido(id: number, estado: EstadoPedido): Promise<Pedido> {
  return (await axiosInstance.patch<Pedido>(`/pedidos/${id}/estado`, { estado })).data;
}

/** GET /pedidos/resumen — indicadores del panel (admin). */
export async function obtenerResumen(): Promise<ResumenPedidos> {
  return (await axiosInstance.get<ResumenPedidos>('/pedidos/resumen')).data;
}
