"""Modelo Producto (paquete Catálogo del UML)."""

from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.categorias.models import Categoria
    from app.modules.pedidos.models import DetallePedido


class Producto(SQLModel, table=True):
    """Producto del catálogo; pertenece a UNA categoría.

    Se vende solo si está activo, disponible y con stock >= cantidad (RN-01).
    El stock se descuenta al crear el pedido y se restituye al cancelarlo (RN-03).
    Baja lógica con `activo = False`.
    Las restricciones >= 0 se validan en los schemas y en el Service.
    """

    __tablename__ = "producto"

    id: Optional[int] = Field(default=None, primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", index=True)
    nombre: str = Field(max_length=150, index=True)
    descripcion: Optional[str] = Field(default=None)
    precio_base: float  # >= 0
    imagen_url: Optional[str] = Field(default=None)
    stock: int = Field(default=0)  # >= 0
    disponible: bool = Field(default=True)
    activo: bool = Field(default=True)

    # Categoria 1:N Producto
    categoria: Optional["Categoria"] = Relationship(back_populates="productos")
    # Producto 1:N DetallePedido (líneas de pedido que lo referencian)
    detalles: list["DetallePedido"] = Relationship(back_populates="producto")
