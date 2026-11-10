"""Schemas de producto (SQLModel sin table=True)."""

from typing import Annotated, Optional

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

from app.modules.categorias.schemas import CategoriaRead

NombreProducto = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=2, max_length=150)
]
Descripcion = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]
ImagenUrl = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class ProductoCreate(SQLModel):
    nombre: NombreProducto
    descripcion: Optional[Descripcion] = None
    precio_base: float = Field(ge=0)
    imagen_url: Optional[ImagenUrl] = None
    stock: int = Field(default=0, ge=0)
    disponible: bool = True
    categoria_id: int


class ProductoUpdate(SQLModel):
    """Actualización parcial: solo se modifican los campos enviados."""

    nombre: Optional[NombreProducto] = None
    descripcion: Optional[Descripcion] = None
    precio_base: Optional[float] = Field(default=None, ge=0)
    imagen_url: Optional[ImagenUrl] = None
    stock: Optional[int] = Field(default=None, ge=0)
    disponible: Optional[bool] = None
    categoria_id: Optional[int] = None


class ProductoStockUpdate(SQLModel):
    """PATCH /productos/{id}/stock: solo stock y disponibilidad."""

    stock: int = Field(ge=0)
    disponible: bool


class ProductoRead(SQLModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    precio_base: float
    imagen_url: Optional[str]
    stock: int
    disponible: bool
    categoria_id: int
    activo: bool
    categoria: CategoriaRead  # se arma desde la relación Producto.categoria


class ProductosPaginados(SQLModel):
    total: int
    items: list[ProductoRead]
