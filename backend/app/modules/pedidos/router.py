"""Pedidos.

- Crear y consultar: cualquier usuario autenticado (rol user o admin, RN-05).
  Un user sólo ve sus propios pedidos; un admin ve todos.
- Cambiar el estado y eliminar: sólo admin.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import UsuarioActivo, get_current_active_user, require_role
from app.core.exceptions import (
    ConflictoNegocio,
    DatosInvalidos,
    DominioError,
    RecursoNoEncontrado,
)
from app.modules.pedidos.schemas import PedidoCreate, PedidoRead, PedidoUpdate
from app.modules.pedidos.service import PedidoService
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork

router = APIRouter(
    prefix="/pedidos",
    tags=["pedidos"],
    dependencies=[Depends(get_current_active_user)],
)


def get_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


def traducir(error: DominioError) -> HTTPException:
    """Traduce las excepciones del servicio a respuestas HTTP."""
    if isinstance(error, RecursoNoEncontrado):  # pedido o producto inexistente
        return HTTPException(status.HTTP_404_NOT_FOUND, detail=error.mensaje)
    if isinstance(error, DatosInvalidos):  # estado fuera del catálogo
        return HTTPException(422, detail=error.mensaje)
    if isinstance(error, ConflictoNegocio):  # estado terminal
        return HTTPException(status.HTTP_409_CONFLICT, detail=error.mensaje)
    return HTTPException(status.HTTP_400_BAD_REQUEST, detail=error.mensaje)


@router.get("/", response_model=list[PedidoRead])
def listar_pedidos(usuario: UsuarioActivo, service: PedidoService = Depends(get_service)):
    return service.listar(usuario)


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(
    pedido_id: int, usuario: UsuarioActivo, service: PedidoService = Depends(get_service)
):
    try:
        return service.obtener(pedido_id, usuario)
    except DominioError as e:
        raise traducir(e)


@router.post("/", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    datos: PedidoCreate, usuario: UsuarioActivo, service: PedidoService = Depends(get_service)
):
    try:
        return service.crear(datos, usuario)
    except DominioError as e:
        raise traducir(e)


@router.put(
    "/{pedido_id}",
    response_model=PedidoRead,
    dependencies=[Depends(require_role(["admin"]))],
)
def actualizar_estado_pedido(
    pedido_id: int, datos: PedidoUpdate, service: PedidoService = Depends(get_service)
):
    try:
        return service.actualizar_estado(pedido_id, datos)
    except DominioError as e:
        raise traducir(e)


@router.delete(
    "/{pedido_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(["admin"]))],
)
def eliminar_pedido(pedido_id: int, service: PedidoService = Depends(get_service)):
    try:
        service.eliminar(pedido_id)
    except DominioError as e:
        raise traducir(e)
