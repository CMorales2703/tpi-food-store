from sqlmodel import select

from app.core.repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    model = Pedido

    def listar(self, usuario_id: int | None = None) -> list[Pedido]:
        """Pedidos no eliminados, del más reciente al más antiguo.
        Con usuario_id, sólo los de ese usuario."""
        stmt = select(Pedido).where(Pedido.deleted_at.is_(None))  # type: ignore[union-attr]
        if usuario_id is not None:
            stmt = stmt.where(Pedido.usuario_id == usuario_id)
        return list(self.session.exec(stmt.order_by(Pedido.id.desc())).all())  # type: ignore[union-attr]

    def refrescar(self, pedido: Pedido) -> Pedido:
        self.session.refresh(pedido)
        return pedido


class DetallePedidoRepository(BaseRepository[DetallePedido]):
    model = DetallePedido

    def de_pedido(self, pedido_id: int) -> list[DetallePedido]:
        stmt = select(DetallePedido).where(DetallePedido.pedido_id == pedido_id)
        return list(self.session.exec(stmt).all())
