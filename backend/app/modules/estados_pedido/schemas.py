from pydantic import BaseModel, ConfigDict


class EstadoPedidoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    codigo: str
    descripcion: str
    orden: int
    es_terminal: bool
