"""Autenticación: registro público, login con JWT en cookie HttpOnly, logout y /me."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import UsuarioActivo
from app.core.exceptions import DominioError, a_http
from app.core.security import create_access_token
from app.modules.usuarios.schemas import MensajeRespuesta, UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["auth"])


def get_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(datos: UserCreate, service: UsuarioService = Depends(get_service)):
    """Registro público (no requiere sesión). Siempre crea el usuario con rol user."""
    try:
        return service.registrar(datos)
    except DominioError as e:
        raise a_http(e)


@router.post("/token", response_model=UserPublic)
def login(
    response: Response,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: UsuarioService = Depends(get_service),
):
    """Recibe username y password como formulario OAuth2.

    RN-03: el JWT viaja SÓLO en la cookie HttpOnly `access_token`; el cuerpo
    de la respuesta trae los datos públicos del usuario, nunca el token.
    """
    try:
        usuario = service.autenticar(form.username, form.password)
    except DominioError as e:
        raise a_http(e)

    token = create_access_token(subject=usuario.username, extra={"role": usuario.role})
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,  # JavaScript no puede leerla (protege ante XSS)
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,  # type: ignore[arg-type]
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return UserPublic.model_validate(usuario)


@router.post("/logout", response_model=MensajeRespuesta)
def logout(response: Response):
    """Responde con un Set-Cookie que borra la cookie en el navegador."""
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,  # type: ignore[arg-type]
        path="/",
    )
    return MensajeRespuesta(detail="Sesión cerrada")


@router.get("/me", response_model=UserPublic)
def me(usuario: UsuarioActivo):
    """Datos del usuario autenticado (requiere sesión válida y cuenta activa)."""
    return UserPublic.model_validate(usuario)
