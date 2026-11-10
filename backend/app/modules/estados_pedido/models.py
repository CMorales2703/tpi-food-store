from sqlmodel import Field, SQLModel


class EstadoPedido(SQLModel, table=True):
    """Tabla de catálogo (diagrama UML, paquete Ventas & Transacciones).

    RN-06: se carga con seed.py y la API sólo expone GET (no tiene escrituras,
    por eso tampoco necesita borrado lógico).
    """

    __tablename__ = "estado_pedido"

    # PK natural
    codigo: str = Field(primary_key=True, max_length=20)

    # Atributos
    descripcion: str = Field(max_length=80, nullable=False)
    orden: int = Field(nullable=False)
    es_terminal: bool = Field(default=False, nullable=False)
