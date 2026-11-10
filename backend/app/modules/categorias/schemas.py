"""Schemas de categoría (SQLModel sin table=True)."""

from typing import Annotated, Optional

from pydantic import StringConstraints
from sqlmodel import SQLModel

# strip_whitespace quita los espacios de los extremos: "  " queda vacío y no pasa el mínimo
NombreCategoria = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)
]
Descripcion = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class CategoriaCreate(SQLModel):
    nombre: NombreCategoria
    descripcion: Optional[Descripcion] = None


class CategoriaUpdate(SQLModel):
    """Actualización parcial: solo se modifican los campos enviados."""

    nombre: Optional[NombreCategoria] = None
    descripcion: Optional[Descripcion] = None


class CategoriaRead(SQLModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    activo: bool
