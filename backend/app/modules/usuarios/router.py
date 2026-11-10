"""Gestión de usuarios: solo admin (listado, activar y desactivar)."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import SoloAdmin
from app.core.exceptions import DominioError, a_http
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["admin-usuarios"])


def get_usuarios_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


ServicioUsuarios = Annotated[UsuarioService, Depends(get_usuarios_service)]


@router.get("", response_model=list[UserPublic])
def listar_usuarios(_admin: SoloAdmin, service: ServicioUsuarios):
    return service.listar()


@router.post("/{usuario_id}/activar", response_model=UserPublic)
def activar_usuario(usuario_id: int, _admin: SoloAdmin, service: ServicioUsuarios):
    try:
        return service.activar(usuario_id)
    except DominioError as e:
        raise a_http(e)  # 404


@router.post("/{usuario_id}/desactivar", response_model=UserPublic)
def desactivar_usuario(usuario_id: int, admin: SoloAdmin, service: ServicioUsuarios):
    try:
        return service.desactivar(usuario_id, actor=admin)  # 400 si es él mismo
    except DominioError as e:
        raise a_http(e)  # 404
