"""Modelo Categoria (paquete Catálogo del UML)."""

from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.productos.models import Producto


class Categoria(SQLModel, table=True):
    """Agrupa productos.

    Baja lógica con `activo = False`. La baja NO libera el nombre único
    ni oculta sus productos (para retirarlos se dan de baja los productos).
    """

    __tablename__ = "categoria"

    id: Optional[int] = Field(default=None, primary_key=True)
    # Único; el largo 2..100 se valida en el schema y en el Service
    nombre: str = Field(max_length=100, unique=True, index=True)
    descripcion: Optional[str] = Field(default=None)
    activo: bool = Field(default=True)

    # Categoria 1:N Producto
    productos: list["Producto"] = Relationship(back_populates="categoria")
