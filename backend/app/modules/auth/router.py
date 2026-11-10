"""Autenticación: registro público, login con JWT en cookie HttpOnly, logout y /me."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import UsuarioActivo
from app.core.exceptions import DominioError, a_http
from app.core.security import create_access_token
from app.modules.auth.schemas import MensajeRespuesta
from app.modules.auth.service import AuthService
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())


ServicioAuth = Annotated[AuthService, Depends(get_auth_service)]


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(datos: UserCreate, service: ServicioAuth):
    """Registro público (no requiere sesión). Siempre crea el usuario con rol user."""
    try:
        return service.registrar(datos)
    except DominioError as e:
        raise a_http(e)  # 409 UsuarioDuplicado


@router.post("/token", response_model=MensajeRespuesta)
def login(
    response: Response,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: ServicioAuth,
):
    """Login con formulario OAuth2 (username, password).

    El JWT viaja SOLO en la cookie HttpOnly `access_token`, que vence junto con
    el token. El cuerpo de la respuesta no incluye el token.
    """
    usuario = service.autenticar(form.username, form.password)  # 401 / 400
    token = create_access_token(subject=usuario.username, extra={"role": usuario.role})
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,  # JavaScript no puede leerla (protege ante XSS)
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return MensajeRespuesta(message="Login exitoso")


@router.post("/logout", response_model=MensajeRespuesta)
def logout(response: Response):
    """Responde con un Set-Cookie que borra la cookie en el navegador."""
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    return MensajeRespuesta(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic)
def me(usuario: UsuarioActivo):
    """Usuario autenticado (requiere sesión válida y cuenta activa)."""
    return UserPublic.model_validate(usuario)
