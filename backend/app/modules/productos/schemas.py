from datetime import datetime
from decimal import Decimal
from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.modules.categorias.schemas import CategoriaRead
from app.modules.ingredientes.schemas import IngredienteRead

# RN-06: nombre obligatorio (no vacío ni sólo espacios), no único
NombreProducto = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)
]
# RN-07: precio_base >= 0
PrecioBase = Annotated[Decimal, Field(ge=0, max_digits=10, decimal_places=2)]
IdPositivo = Annotated[int, Field(gt=0)]
# Multiplicidad 1..* (diagrama UML): todo producto pertenece a al menos una categoría.
# La primera de la lista queda como categoría principal.
CategoriaIds = Annotated[list[IdPositivo], Field(min_length=1)]
# Ingredientes: 0..* (un producto puede no tener ingredientes cargados)
IngredienteIds = list[IdPositivo]


class ProductoCreate(BaseModel):
    nombre: NombreProducto
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio_base: PrecioBase
    imagenes_url: list[str] = Field(default_factory=list)
    disponible: bool = True  # RN-08
    categoria_ids: CategoriaIds
    ingrediente_ids: IngredienteIds = Field(default_factory=list)


class ProductoUpdate(BaseModel):
    """Campos opcionales. Si se envía categoria_ids o ingrediente_ids,
    reemplaza los vínculos del producto."""

    nombre: Optional[NombreProducto] = None
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio_base: Optional[PrecioBase] = None
    imagenes_url: Optional[list[str]] = None
    disponible: Optional[bool] = None
    categoria_ids: Optional[CategoriaIds] = None
    ingrediente_ids: Optional[IngredienteIds] = None


class ProductoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: Optional[str]
    precio_base: float
    imagenes_url: list[str]
    disponible: bool
    created_at: datetime
    updated_at: datetime
    # La primera categoría es la principal
    categorias: list[CategoriaRead] = []
    ingredientes: list[IngredienteRead] = []


# ---------- ProductoCategoria (tabla de enlace) ----------
class ProductoCategoriaCreate(BaseModel):
    categoria_id: int = Field(gt=0)
    es_principal: bool = False


class ProductoCategoriaUpdate(BaseModel):
    es_principal: bool


class ProductoCategoriaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    producto_id: int
    categoria_id: int
    es_principal: bool
    created_at: datetime
