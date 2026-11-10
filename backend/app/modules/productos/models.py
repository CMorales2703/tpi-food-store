from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import JSON, CheckConstraint, Column, DateTime, Numeric, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel

from app.core.database import ahora

# TEXT[] en PostgreSQL; JSON como variante si se usa SQLite para pruebas locales
TipoImagenes = ARRAY(Text).with_variant(JSON(), "sqlite")


class ProductoCategoria(SQLModel, table=True):
    """Tabla de enlace Producto <-> Categoria con PK compuesta.
    Borrado lógico: desasociar completa deleted_at y volver a asociar lo reactiva."""

    __tablename__ = "producto_categoria"

    # PK compuesta
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)

    # Atributos
    es_principal: bool = Field(default=False, nullable=False)

    # Audit
    created_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    deleted_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )


class ProductoIngrediente(SQLModel, table=True):
    """Tabla de enlace Producto <-> Ingrediente (0..* ingredientes por producto).
    Borrado lógico igual que ProductoCategoria."""

    __tablename__ = "producto_ingrediente"

    # PK compuesta
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", primary_key=True)

    # Audit
    created_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    deleted_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )


class Producto(SQLModel, table=True):
    """Tabla Producto — paquete Catálogo de Productos.
    El stock queda excluido: pertenece al dominio INVENTARIO (SRP)."""

    __tablename__ = "producto"
    __table_args__ = (CheckConstraint("precio_base >= 0", name="ck_producto_precio_base"),)

    # PK
    id: Optional[int] = Field(default=None, primary_key=True)

    # Atributos
    nombre: str = Field(max_length=150, nullable=False, index=True)
    descripcion: Optional[str] = Field(default=None, sa_column=Column(Text))
    precio_base: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    imagenes_url: list[str] = Field(
        default_factory=list, sa_column=Column(TipoImagenes, nullable=False)
    )
    disponible: bool = Field(default=True, nullable=False)

    # Audit
    created_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    deleted_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )

    # Las categorías e ingredientes activos se leen con consultas del repositorio
    # (filtrando los vínculos con borrado lógico), no con una relación del ORM.
