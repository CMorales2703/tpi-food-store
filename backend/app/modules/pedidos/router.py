"""Pedidos: crear (sesión), consultar (dueño o admin), cambiar estado (admin), cancelar (dueño)."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import SoloAdmin, UsuarioActivo
from app.core.exceptions import DominioError, a_http
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import PedidoService
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


ServicioPedidos = Annotated[PedidoService, Depends(get_pedido_service)]


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(datos: PedidoCreate, usuario: UsuarioActivo, service: ServicioPedidos):
    """RN-01: crea el pedido desde el carrito en una sola transacción."""
    try:
        return service.crear(datos, usuario)
    except DominioError as e:
        # 404 ProductoNoEncontrado; 400 StockInsuficiente, ProductoNoDisponible, ProductoRepetido
        raise a_http(e)


@router.get("", response_model=PedidosPaginados)
def listar_pedidos(
    usuario: UsuarioActivo,
    service: ServicioPedidos,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: Optional[EstadoPedido] = None,
):
    """Propios (user) o todos (admin)."""
    return service.listar(usuario, skip, limit, estado)


# Se declara ANTES de /{pedido_id}: si no, "resumen" se tomaría como un id (y daría 422)
@router.get("/resumen", response_model=ResumenPedidos)
def resumen_pedidos(_admin: SoloAdmin, service: ServicioPedidos):
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(pedido_id: int, usuario: UsuarioActivo, service: ServicioPedidos):
    try:
        return service.obtener(pedido_id, usuario)
    except DominioError as e:
        raise a_http(e)  # 404; 403 PedidoAjeno


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def cambiar_estado_pedido(
    pedido_id: int, datos: CambioEstado, _admin: SoloAdmin, service: ServicioPedidos
):
    """RN-02 y RN-03: avanza o cancela según la máquina de estados."""
    try:
        return service.cambiar_estado(pedido_id, datos.estado)
    except DominioError as e:
        raise a_http(e)  # 404; 400 TransicionInvalida


@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead)
def cancelar_pedido(pedido_id: int, usuario: UsuarioActivo, service: ServicioPedidos):
    """RN-03 y RN-04: el dueño cancela su pedido, solo en PENDIENTE."""
    try:
        return service.cancelar(pedido_id, usuario)
    except DominioError as e:
        raise a_http(e)  # 404; 403 PedidoAjeno; 400 si no está PENDIENTE
