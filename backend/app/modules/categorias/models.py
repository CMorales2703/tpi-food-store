from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Text
from sqlmodel import Field, SQLModel

from app.core.database import ahora


class Categoria(SQLModel, table=True):
    """Tabla Categoria — paquete Catálogo de Productos."""

    __tablename__ = "categoria"

    # PK
    id: Optional[int] = Field(default=None, primary_key=True)

    # Atributos
    nombre: str = Field(max_length=100, unique=True, nullable=False, index=True)
    descripcion: str = Field(default="", sa_column=Column(Text, nullable=False, server_default=""))

    # Audit (borrado lógico con deleted_at)
    created_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    deleted_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
