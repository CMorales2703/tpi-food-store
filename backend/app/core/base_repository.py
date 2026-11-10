"""Repositorio base con el acceso genérico a una tabla.

El repositorio encapsula las consultas de UNA entidad y no tiene reglas de negocio.
Nunca llama a commit(): confirmar o revertir es responsabilidad del Unit of Work.

No hay método update: dentro del Unit of Work alcanza con asignar los atributos
del objeto (producto.stock = 5); la sesión detecta el cambio y lo guarda en el commit.
Tampoco hay baja lógica acá: poner activo=False y tratar un registro dado de baja
como inexistente son reglas que decide cada Service.
"""

from collections.abc import Sequence
from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select

ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, id_: int) -> ModelT | None:
        return self.session.get(self.model, id_)

    def get_all(self) -> Sequence[ModelT]:
        return self.session.exec(select(self.model)).all()

    def add(self, obj: ModelT) -> ModelT:
        """Agrega el objeto y hace flush: el INSERT se envía y el id queda disponible,
        pero la transacción sigue abierta hasta el commit del Unit of Work."""
        self.session.add(obj)
        self.session.flush()
        return obj

    def delete(self, obj: ModelT) -> None:
        """Borrado físico. Lo pide el enunciado para el repositorio base; en este
        sistema no se usa (categorías y productos tienen baja lógica y los pedidos
        no se borran)."""
        self.session.delete(obj)
        self.session.flush()
