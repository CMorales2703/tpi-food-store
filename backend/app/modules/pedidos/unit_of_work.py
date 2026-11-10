from app.core.unit_of_work import BaseUnitOfWork
from app.modules.estados_pedido.repository import EstadoPedidoRepository
from app.modules.pedidos.repository import DetallePedidoRepository, PedidoRepository
from app.modules.productos.repository import ProductoRepository


class PedidoUnitOfWork(BaseUnitOfWork):
    """Expone los repositorios que necesitan los casos de uso de Pedido:
    pedidos, detalles, productos (validar y tomar el precio) y el catálogo de estados."""

    pedidos: PedidoRepository
    detalles: DetallePedidoRepository
    productos: ProductoRepository
    estados: EstadoPedidoRepository

    def _crear_repositorios(self) -> None:
        self.pedidos = PedidoRepository(self.session)
        self.detalles = DetallePedidoRepository(self.session)
        self.productos = ProductoRepository(self.session)
        self.estados = EstadoPedidoRepository(self.session)
