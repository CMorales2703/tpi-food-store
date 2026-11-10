"""Catálogo EstadoPedido. RN-06: sólo GET.

No hay rutas POST/PUT/PATCH/DELETE: FastAPI responde 405 Method Not Allowed
ante cualquier escritura sobre estas URLs.
"""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_active_user
from app.core.exceptions import DominioError, a_http
from app.modules.estados_pedido.schemas import EstadoPedidoRead
from app.modules.estados_pedido.service import EstadoPedidoService
from app.modules.estados_pedido.unit_of_work import EstadoPedidoUnitOfWork

# RN-07: lectura para cualquier usuario autenticado
router = APIRouter(
    prefix="/estados-pedido",
    tags=["catalogos"],
    dependencies=[Depends(get_current_active_user)],
)


def get_service() -> EstadoPedidoService:
    return EstadoPedidoService(EstadoPedidoUnitOfWork())


@router.get("/", response_model=list[EstadoPedidoRead])
def listar_estados(service: EstadoPedidoService = Depends(get_service)):
    return service.listar()


@router.get("/{codigo}", response_model=EstadoPedidoRead)
def obtener_estado(codigo: str, service: EstadoPedidoService = Depends(get_service)):
    try:
        return service.obtener(codigo)
    except DominioError as e:
        raise a_http(e)
