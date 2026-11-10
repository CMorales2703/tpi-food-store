from app.core.exceptions import RecursoNoEncontrado
from app.modules.estados_pedido.schemas import EstadoPedidoRead
from app.modules.estados_pedido.unit_of_work import EstadoPedidoUnitOfWork


class EstadoPedidoNoEncontrado(RecursoNoEncontrado):
    def __init__(self, codigo: str) -> None:
        super().__init__(f"Estado de pedido '{codigo}' no encontrado")


class EstadoPedidoService:
    """Catálogo de sólo lectura."""

    def __init__(self, uow: EstadoPedidoUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[EstadoPedidoRead]:
        with self.uow as uow:
            return [EstadoPedidoRead.model_validate(e) for e in uow.estados.listar()]

    def obtener(self, codigo: str) -> EstadoPedidoRead:
        with self.uow as uow:
            estado = uow.estados.obtener(codigo.upper())
            if estado is None:
                raise EstadoPedidoNoEncontrado(codigo)
            return EstadoPedidoRead.model_validate(estado)
