"""Unit of Work base.

Agrupa las operaciones de un caso de uso en UNA transacción:

    with uow:
        uow.pedidos.create(...)
        uow.detalles.create(...)
    # al salir del with: commit si no hubo errores, rollback si hubo una excepción

Cada módulo hereda de BaseUnitOfWork y expone en `_crear_repositorios`
los repositorios que sus casos de uso necesitan.
"""

from types import TracebackType

from sqlmodel import Session

from app.core.database import engine


class BaseUnitOfWork:
    session: Session

    def __enter__(self) -> "BaseUnitOfWork":
        # expire_on_commit=False: los objetos siguen legibles después del commit
        self.session = Session(engine, expire_on_commit=False)
        self._crear_repositorios()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()
        # No se suprime la excepción: el Router la traduce a una respuesta HTTP

    def _crear_repositorios(self) -> None:  # pragma: no cover - lo redefinen los módulos
        raise NotImplementedError
