"""Dependencias reutilizables de autenticación y autorización.

    get_current_user          → valida el JWT (cookie) y carga el usuario      (401)
    get_current_active_user   → además exige que la cuenta no esté desactivada (400)
    require_role(["admin"])   → además exige uno de los roles indicados        (403)

Se encadenan: require_role depende de get_current_active_user, que depende de
get_current_user. FastAPI cachea cada dependencia por petición, así que el
usuario se busca una sola vez aunque varias rutas/routers la declaren.
"""

from collections.abc import Callable
from typing import Annotated

import jwt
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.core.exceptions import CuentaDesactivada, NoAutenticado, SinPermisos, a_http
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    """Extiende OAuth2PasswordBearer para leer el token de la cookie HttpOnly.

    Si no hay cookie, intenta con el encabezado Authorization: Bearer
    (útil para probar desde Swagger con el botón Authorize).
    """

    async def __call__(self, request: Request) -> str | None:
        token = request.cookies.get(settings.COOKIE_NAME)
        if token:
            return token
        return await super().__call__(request)


oauth2_scheme = OAuth2PasswordBearerWithCookie(
    tokenUrl=f"{settings.API_PREFIX}/auth/token", auto_error=False
)


def get_current_user(token: Annotated[str | None, Depends(oauth2_scheme)]) -> Usuario:
    """RN-10: el JWT se valida en cada petición protegida."""
    if not token:
        raise a_http(NoAutenticado("No autenticado: iniciá sesión"))
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise a_http(NoAutenticado("La sesión venció: iniciá sesión de nuevo"))
    except jwt.PyJWTError:
        raise a_http(NoAutenticado("Token inválido"))

    username = payload.get("sub")
    if not isinstance(username, str):
        raise a_http(NoAutenticado("Token inválido"))

    with UsuarioUnitOfWork() as uow:
        usuario = uow.usuarios.buscar_por_username(username)
    if usuario is None:
        raise a_http(NoAutenticado("El usuario del token no existe"))
    return usuario


def get_current_active_user(
    usuario: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    if usuario.disabled:
        raise a_http(CuentaDesactivada())
    return usuario


def require_role(roles: list[str]) -> Callable[[Usuario], Usuario]:
    """Fábrica de dependencias: require_role(["admin"]) sólo deja pasar a esos roles."""

    def verificar_rol(
        usuario: Annotated[Usuario, Depends(get_current_active_user)],
    ) -> Usuario:
        if usuario.role not in roles:
            raise a_http(SinPermisos("No tenés permisos para realizar esta acción"))
        return usuario

    return verificar_rol


# Alias para anotar parámetros de los endpoints
UsuarioActivo = Annotated[Usuario, Depends(get_current_active_user)]
SoloAdmin = Depends(require_role(["admin"]))
