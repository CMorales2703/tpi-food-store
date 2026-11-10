"""Modelos Pedido y DetallePedido (paquete Pedidos del UML)."""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.core.database import ahora

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


class Pedido(SQLModel, table=True):
    """Pedido de un usuario.

    estado: PENDIENTE → EN_PREPARACION | CANCELADO; EN_PREPARACION → ENTREGADO | CANCELADO;
    ENTREGADO y CANCELADO son terminales (RN-02). El mapa de transiciones vive en el Service.
    forma_pago: EFECTIVO | TRANSFERENCIA; direccion_entrega 5..200 (RN-06, se validan en el schema).
    total = suma de DetallePedido.subtotal; fijo desde la creación (RN-05).
    No se borra: se cancela.
    """

    __tablename__ = "pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    estado: str = Field(default="PENDIENTE", max_length=20, index=True)
    forma_pago: str = Field(max_length=20)
    direccion_entrega: str = Field(max_length=200)
    notas: Optional[str] = Field(default=None)
    total: float = Field(default=0)
    created_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    # onupdate: SQLAlchemy la actualiza sola en cada UPDATE del pedido (p. ej. al cambiar
    # de estado), sin que el Service tenga que acordarse de hacerlo
    updated_at: datetime = Field(
        default_factory=ahora,
        sa_column=Column(DateTime(timezone=True), nullable=False, onupdate=ahora),
    )

    # Usuario 1:N Pedido
    usuario: Optional["Usuario"] = Relationship(back_populates="pedidos")
    # Pedido 1:N DetallePedido — composición: las líneas pertenecen al pedido
    # (cascade: se guardan junto con el pedido; delete-orphan: una línea no existe sin pedido)
    items: list["DetallePedido"] = Relationship(
        back_populates="pedido",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "DetallePedido.id"},
    )


class DetallePedido(SQLModel, table=True):
    """Línea de un pedido. Inmutable (RN-05).

    nombre_producto y precio_unitario se COPIAN del producto al crear el pedido:
    si después cambia el precio o el nombre del producto, el pedido no cambia.
    subtotal = precio_unitario × cantidad. Un producto no se repite en el pedido (RN-01).
    """

    __tablename__ = "detalle_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", index=True)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    cantidad: int  # >= 1
    nombre_producto: str = Field(max_length=150)
    precio_unitario: float
    subtotal: float

    # Pedido 1:N DetallePedido
    pedido: Optional[Pedido] = Relationship(back_populates="items")
    # Producto 1:N DetallePedido
    producto: Optional["Producto"] = Relationship(back_populates="detalles")
