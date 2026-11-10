from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

from app.core.database import ahora


class Ingrediente(SQLModel, table=True):
    """Tabla Ingrediente. Misma estructura que Categoría (audit + borrado lógico)."""

    __tablename__ = "ingrediente"

    # PK
    id: Optional[int] = Field(default=None, primary_key=True)

    # Atributos
    nombre: str = Field(max_length=100, unique=True, nullable=False, index=True)

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
