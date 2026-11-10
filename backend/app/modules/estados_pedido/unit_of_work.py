from app.core.unit_of_work import BaseUnitOfWork
from app.modules.estados_pedido.repository import EstadoPedidoRepository


class EstadoPedidoUnitOfWork(BaseUnitOfWork):
    estados: EstadoPedidoRepository

    def _crear_repositorios(self) -> None:
        self.estados = EstadoPedidoRepository(self.session)
