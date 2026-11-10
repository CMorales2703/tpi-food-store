"""Unit of Work base.

Agrupa las operaciones de un caso de uso en UNA transacción:

    with self.uow as uow:
        pedido = uow.pedidos.add(...)
        producto.stock -= cantidad
        return PedidoRead.model_validate(pedido)
    # al salir del with: commit si no hubo errores, rollback si hubo una excepción

REGLA: el commit ocurre SOLO acá, en __exit__. Ningún Service ni Router llama
a session.commit().

Cada módulo hereda de UnitOfWork y crea en `_crear_repositorios` los
repositorios que sus casos de uso necesitan, todos sobre la misma sesión.
"""

from types import TracebackType
from typing import Self

from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:
    session: Session

    def __enter__(self) -> Self:
        self.session = session_factory()
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
        # Devuelve None: la excepción NO se suprime y llega al Router, que la traduce a HTTP

    def _crear_repositorios(self) -> None:
        """Lo redefine cada módulo para exponer sus repositorios."""
        raise NotImplementedError
