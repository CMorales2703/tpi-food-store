from app.core.repository import BaseRepository
from app.modules.estados_pedido.models import EstadoPedido


class EstadoPedidoRepository(BaseRepository[EstadoPedido]):
    model = EstadoPedido

    def listar(self) -> list[EstadoPedido]:
        return self.list_all(order_by=EstadoPedido.orden)

    def obtener(self, codigo: str) -> EstadoPedido | None:
        return self.get_by_id(codigo)
