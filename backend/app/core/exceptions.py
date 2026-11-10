"""Bases comunes para las excepciones de dominio.

Cada módulo define sus excepciones concretas en su service.py heredando de
estas bases (p. ej. ProductoNoEncontrado(RecursoNoEncontrado)). Los servicios
las lanzan sin conocer HTTP; el Router las captura con try/except y las traduce
con `a_http`.
"""

from fastapi import HTTPException, status


class DominioError(Exception):
    """Regla de negocio violada → 400 (StockInsuficiente, TransicionInvalida, ...)."""

    status_code: int = status.HTTP_400_BAD_REQUEST

    def __init__(self, mensaje: str) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje


class RecursoNoEncontrado(DominioError):
    """El recurso no existe o está dado de baja → 404."""

    status_code = status.HTTP_404_NOT_FOUND


class ConflictoNegocio(DominioError):
    """Choca con un dato único existente (nombre, username, email) → 409."""

    status_code = status.HTTP_409_CONFLICT


class AccesoDenegado(DominioError):
    """El recurso existe pero pertenece a otro usuario (PedidoAjeno) → 403."""

    status_code = status.HTTP_403_FORBIDDEN


def a_http(error: DominioError) -> HTTPException:
    """Traduce una excepción de dominio a HTTPException (la usan los routers)."""
    return HTTPException(status_code=error.status_code, detail=error.mensaje)
