"""Gestión de usuarios: sólo admin (GET /admin/usuarios, activar y desactivar)."""

from fastapi import APIRouter, Depends

from app.core.dependencies import require_role
from app.core.exceptions import DominioError, a_http
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["admin-usuarios"])


def get_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


@router.get("", response_model=list[UserPublic])
def listar_usuarios(
    _admin: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_service),
):
    return service.listar()


@router.post("/{usuario_id}/activar", response_model=UserPublic)
def activar_usuario(
    usuario_id: int,
    admin: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_service),
):
    try:
        return service.cambiar_estado(usuario_id, disabled=False, actor=admin)
    except DominioError as e:
        raise a_http(e)


@router.post("/{usuario_id}/desactivar", response_model=UserPublic)
def desactivar_usuario(
    usuario_id: int,
    admin: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_service),
):
    try:
        return service.cambiar_estado(usuario_id, disabled=True, actor=admin)
    except DominioError as e:
        raise a_http(e)
