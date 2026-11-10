"""Gestión de usuarios por el admin: listado, activación y desactivación.

En auth y usuarios el enunciado admite lanzar HTTPException desde el Service;
igual se usan excepciones de dominio para los casos que tienen nombre propio.
"""

from fastapi import HTTPException, status

from app.core.exceptions import RecursoNoEncontrado
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioNoEncontrado(RecursoNoEncontrado):
    def __init__(self, usuario_id: int) -> None:
        super().__init__(f"Usuario {usuario_id} no encontrado")


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[UserPublic]:
        """Todos los usuarios, activos y desactivados (el admin los gestiona)."""
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.listar()]

    def activar(self, usuario_id: int) -> UserPublic:
        """Alta lógica (disabled = False). Idempotente: 200 aunque ya estuviera activo."""
        return self._cambiar_disabled(usuario_id, disabled=False)

    def desactivar(self, usuario_id: int, actor: Usuario) -> UserPublic:
        """Baja lógica (disabled = True). Idempotente. El admin no puede desactivarse a sí mismo."""
        if usuario_id == actor.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No podés desactivar tu propia cuenta",
            )
        return self._cambiar_disabled(usuario_id, disabled=True)

    def _cambiar_disabled(self, usuario_id: int, disabled: bool) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado(usuario_id)
            usuario.disabled = disabled  # el commit del Unit of Work lo persiste
            return UserPublic.model_validate(usuario)
