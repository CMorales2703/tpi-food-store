"""Paquete Ventas & Transacciones (simplificado): Pedido y DetallePedido.

Desde el TP9 el pedido tiene dueño (usuario_id) y su estado es una FK al
catálogo EstadoPedido, como en el diagrama UML.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, Numeric
from sqlmodel import Field, Relationship, SQLModel

from app.core.database import ahora
from app.modules.estados_pedido.models import EstadoPedido
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ESTADO_INICIAL = "PENDIENTE"


class Pedido(SQLModel, table=True):
    __tablename__ = "pedido"
    __table_args__ = (CheckConstraint("total >= 0", name="ck_pedido_total"),)

    # PK (autoincremental)
    id: Optional[int] = Field(default=None, primary_key=True)

    # FK: quién hizo el pedido y en qué estado está
    usuario_id: int = Field(foreign_key="usuario.id", nullable=False, index=True)
    estado: str = Field(foreign_key="estado_pedido.codigo", max_length=20, nullable=False)

    # Atributos
    fecha: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    # DECIMAL(10,2) en la base; float en Python (asdecimal=False)
    total: float = Field(
        default=0, sa_column=Column(Numeric(10, 2, asdecimal=False), nullable=False)
    )

    # Audit (borrado lógico)
    deleted_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )

    # Composición: un pedido contiene 1..* detalles
    detalles: list["DetallePedido"] = Relationship(
        back_populates="pedido",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "DetallePedido.producto_id",
        },
    )
    usuario: Optional[Usuario] = Relationship()
    estado_rel: Optional[EstadoPedido] = Relationship()


class DetallePedido(SQLModel, table=True):
    """Detalle del pedido. No tiene DELETE propio: se conserva junto con el pedido
    (que tiene borrado lógico), así el histórico de ventas queda completo."""

    __tablename__ = "detalle_pedido"
    __table_args__ = (
        CheckConstraint("cantidad >= 1", name="ck_detalle_cantidad"),
        CheckConstraint("precio_unitario >= 0", name="ck_detalle_precio"),
    )

    # PK compuesta (pedido_id, producto_id), como en el diagrama UML
    pedido_id: int = Field(
        sa_column=Column(Integer, ForeignKey("pedido.id", ondelete="CASCADE"), primary_key=True)
    )
    producto_id: int = Field(
        sa_column=Column(Integer, ForeignKey("producto.id", ondelete="RESTRICT"), primary_key=True)
    )

    # Atributos
    cantidad: int = Field(nullable=False)
    # Snapshot del precio_base del producto al crear el pedido
    precio_unitario: float = Field(
        sa_column=Column(Numeric(10, 2, asdecimal=False), nullable=False)
    )

    pedido: Optional[Pedido] = Relationship(back_populates="detalles")
    producto: Optional[Producto] = Relationship()
