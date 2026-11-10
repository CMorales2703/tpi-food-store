from collections.abc import Sequence
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    model = Pedido

    def get_con_items(self, pedido_id: int) -> Pedido | None:
        stmt = (
            select(Pedido)
            .where(Pedido.id == pedido_id)
            .options(selectinload(Pedido.items))  # type: ignore[arg-type]
        )
        return self.session.exec(stmt).first()

    def list_by_usuario(
        self, usuario_id: Optional[int], skip: int, limit: int, estado: Optional[str] = None
    ) -> tuple[int, Sequence[Pedido]]:
        """Pedidos paginados, del más nuevo al más viejo. Devuelve (total, página).
        usuario_id=None devuelve los de todos los usuarios (lo usa el admin)."""
        filtros: list[Any] = []
        if usuario_id is not None:
            filtros.append(Pedido.usuario_id == usuario_id)
        if estado is not None:
            filtros.append(Pedido.estado == estado)

        total = self.session.exec(select(func.count()).select_from(Pedido).where(*filtros)).one()
        stmt = (
            select(Pedido)
            .where(*filtros)
            .options(selectinload(Pedido.items))  # type: ignore[arg-type]
            .order_by(Pedido.created_at.desc(), Pedido.id.desc())  # type: ignore[attr-defined]
            .offset(skip)
            .limit(limit)
        )
        return total, self.session.exec(stmt).all()

    def count_by_estado(self) -> dict[str, int]:
        """{"PENDIENTE": 3, "ENTREGADO": 5, ...} con un solo GROUP BY."""
        stmt = select(Pedido.estado, func.count()).group_by(Pedido.estado)
        return {estado: cantidad for estado, cantidad in self.session.exec(stmt).all()}

    def count_desde(self, desde: datetime) -> int:
        stmt = select(func.count()).select_from(Pedido).where(Pedido.created_at >= desde)
        return self.session.exec(stmt).one()

    def sum_total_by_estado(self, estado: str) -> float:
        stmt = select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == estado)
        return float(self.session.exec(stmt).one())

    def guardar(self, pedido: Pedido) -> Pedido:
        """Envía el UPDATE sin confirmar (flush): así updated_at, que se recalcula
        en cada UPDATE, ya sale actualizado en la respuesta. El commit lo hace el UoW."""
        self.session.add(pedido)
        self.session.flush()
        return pedido
