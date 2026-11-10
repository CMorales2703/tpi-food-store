from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, StringConstraints

# RN-01: obligatorio. strip_whitespace elimina los espacios de los extremos,
# así "   " queda vacío y min_length=1 lo rechaza (422).
NombreCategoria = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]
# RN-03: opcional, default ""
DescripcionCategoria = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class CategoriaCreate(BaseModel):
    nombre: NombreCategoria
    descripcion: DescripcionCategoria = ""


class CategoriaUpdate(BaseModel):
    """Campos opcionales: sólo se modifica lo que se envía."""

    nombre: Optional[NombreCategoria] = None
    descripcion: Optional[DescripcionCategoria] = None


class CategoriaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str
    created_at: datetime
    updated_at: datetime
