"""Schemas de pedidos (SQLModel sin table=True)."""

from datetime import datetime
from typing import Annotated, Literal, Optional

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

EstadoPedido = Literal["PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO"]
FormaPago = Literal["EFECTIVO", "TRANSFERENCIA"]  # RN-06

Direccion = Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=200)]
Notas = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


# ---------- Entrada ----------
class ItemPedidoCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1)


class PedidoCreate(SQLModel):
    """Pedido desde el carrito. El precio NO se recibe: se copia del producto (RN-01)."""

    items: list[ItemPedidoCreate] = Field(min_length=1)
    forma_pago: FormaPago
    direccion_entrega: Direccion  # RN-06: 5 a 200 caracteres
    notas: Optional[Notas] = None


class CambioEstado(SQLModel):
    estado: EstadoPedido


# ---------- Salida ----------
class DetallePedidoRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: EstadoPedido
    forma_pago: FormaPago
    direccion_entrega: str
    notas: Optional[str]
    total: float
    created_at: datetime
    updated_at: datetime
    items: list[DetallePedidoRead]  # se arma desde la relación Pedido.items


class PedidosPaginados(SQLModel):
    total: int
    items: list[PedidoRead]


class ResumenPedidos(SQLModel):
    """Indicadores del panel de administración."""

    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float  # suma de total de los pedidos ENTREGADO
