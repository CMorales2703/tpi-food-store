from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

# RN-10: nombre obligatorio (no vacío ni compuesto sólo por espacios)
NombreIngrediente = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class IngredienteCreate(BaseModel):
    nombre: NombreIngrediente


class IngredienteUpdate(BaseModel):
    nombre: NombreIngrediente


class IngredienteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    created_at: datetime
    updated_at: datetime
