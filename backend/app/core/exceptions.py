"""Excepciones de dominio.

Los servicios lanzan estas excepciones (no conocen HTTP).
Cada Router las traduce al código de estado correspondiente con `a_http`.
"""

from fastapi import HTTPException, status


class DominioError(Exception):
    status_code: int = status.HTTP_400_BAD_REQUEST

    def __init__(self, mensaje: str) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje


class RecursoNoEncontrado(DominioError):
    """El recurso no existe o tiene borrado lógico → 404."""

    status_code = status.HTTP_404_NOT_FOUND


class ConflictoNegocio(DominioError):
    """La operación choca con el estado actual de los datos → 409."""

    status_code = status.HTTP_409_CONFLICT


class DatosInvalidos(DominioError):
    """Los datos violan una regla de negocio → 422."""

    status_code = 422


class NoAutenticado(DominioError):
    """Credenciales o token inválidos → 401."""

    status_code = status.HTTP_401_UNAUTHORIZED


class CuentaDesactivada(DominioError):
    """El usuario existe pero está desactivado (disabled) → 400."""

    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self) -> None:
        super().__init__("Cuenta de usuario desactivada")


class SinPermisos(DominioError):
    """El rol del usuario no alcanza para la operación → 403."""

    status_code = status.HTTP_403_FORBIDDEN


def a_http(error: DominioError) -> HTTPException:
    """Traduce una excepción de dominio a HTTPException (la usan los routers)."""
    headers = {"WWW-Authenticate": "Bearer"} if isinstance(error, NoAutenticado) else None
    return HTTPException(status_code=error.status_code, detail=error.mensaje, headers=headers)
