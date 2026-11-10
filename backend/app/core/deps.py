"""Dependencias reutilizables de autenticación y autorización.

    get_current_user          → lee la cookie, valida el JWT y carga el usuario (401)
    get_current_active_user   → además exige que la cuenta no esté desactivada  (400)
    require_role(["admin"])   → además exige uno de los roles indicados         (403)

Se encadenan: require_role depende de get_current_active_user, que depende de
get_current_user. FastAPI cachea cada dependencia por petición, así que el
usuario se busca una sola vez aunque varias dependencias lo pidan.
"""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyCookie
from jose import ExpiredSignatureError, JWTError

from app.core.config import settings
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

# Lee el JWT de la cookie HttpOnly. Swagger (/docs) lo muestra como esquema de
# seguridad; como /docs se sirve desde el mismo origen que la API, después de
# ejecutar POST /auth/token el navegador envía la cookie solo en cada prueba.
# auto_error=False: si falta la cookie respondemos nosotros con el 401 y el mensaje.
cookie_scheme = APIKeyCookie(name=settings.COOKIE_NAME, auto_error=False)


def _no_autenticado(mensaje: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=mensaje)


def get_current_user(token: Annotated[str | None, Depends(cookie_scheme)]) -> Usuario:
    """El JWT se valida en cada petición protegida."""
    if not token:
        raise _no_autenticado("No autenticado: iniciá sesión")
    try:
        payload = decode_access_token(token)
    except ExpiredSignatureError:
        raise _no_autenticado("La sesión venció: iniciá sesión de nuevo")
    except JWTError:
        raise _no_autenticado("Token inválido")

    username = payload.get("sub")
    if not isinstance(username, str):
        raise _no_autenticado("Token inválido")

    with UsuarioUnitOfWork() as uow:
        usuario = uow.usuarios.get_by_username(username)
    if usuario is None:
        raise _no_autenticado("El usuario del token no existe")
    return usuario


def get_current_active_user(
    usuario: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    if usuario.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cuenta de usuario desactivada"
        )
    return usuario


def require_role(roles: list[str]) -> Callable[[Usuario], Usuario]:
    """Fábrica de dependencias: require_role(["admin"]) solo deja pasar a esos roles."""

    def verificar_rol(
        usuario: Annotated[Usuario, Depends(get_current_active_user)],
    ) -> Usuario:
        if usuario.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos para realizar esta acción",
            )
        return usuario

    return verificar_rol


# Alias para anotar parámetros de los endpoints
UsuarioActivo = Annotated[Usuario, Depends(get_current_active_user)]
SoloAdmin = Annotated[Usuario, Depends(require_role(["admin"]))]
