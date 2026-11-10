from datetime import datetime
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    computed_field,
    model_validator,
)


# ---------- entrada ----------
class DetallePedidoCreate(BaseModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(ge=1)  # cantidad menor que 1 → 422


class PedidoCreate(BaseModel):
    # Un pedido tiene al menos un detalle (lista vacía → 422)
    detalles: Annotated[list[DetallePedidoCreate], Field(min_length=1)]

    @model_validator(mode="after")
    def producto_no_repetido(self) -> "PedidoCreate":
        # Un mismo producto no se repite entre los detalles (→ 422).
        # Sin esta validación la PK compuesta rechazaría el segundo detalle
        # con un IntegrityError y el cliente recibiría un 500.
        ids = [d.producto_id for d in self.detalles]
        repetidos = sorted({i for i in ids if ids.count(i) > 1})
        if repetidos:
            raise ValueError(f"Producto repetido en los detalles: {repetidos}")
        return self


class PedidoUpdate(BaseModel):
    # Código del catálogo EstadoPedido; si no existe en el catálogo → 422
    estado: Annotated[
        str, StringConstraints(strip_whitespace=True, to_upper=True, min_length=1, max_length=20)
    ]


# ---------- salida ----------
class DetallePedidoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    producto_id: int
    nombre_producto: str
    cantidad: int
    precio_unitario: float

    @computed_field  # type: ignore[prop-decorator]
    @property
    def subtotal(self) -> float:
        return round(self.cantidad * self.precio_unitario, 2)


class PedidoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    username: str
    fecha: datetime
    estado: str
    total: float
    detalles: list[DetallePedidoRead]
