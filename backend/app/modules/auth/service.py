"""Registro y autenticación. Usa el modelo Usuario a través del Unit of Work de usuarios."""

from fastapi import HTTPException, status

from app.core.exceptions import ConflictoNegocio
from app.core.security import hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioDuplicado(ConflictoNegocio):
    """username o email ya registrados → 409."""


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def registrar(self, datos: UserCreate) -> UserPublic:
        """Registro público: siempre crea el usuario con rol "user"."""
        with self.uow as uow:
            # Sin distinguir mayúsculas: "Cris" y "cris" son el mismo usuario
            if uow.usuarios.get_by_username(datos.username) is not None:
                raise UsuarioDuplicado(f"El usuario '{datos.username}' ya existe")
            if uow.usuarios.get_by_email(datos.email) is not None:
                raise UsuarioDuplicado(f"El email '{datos.email}' ya está registrado")
            usuario = uow.usuarios.add(
                Usuario(
                    username=datos.username,
                    full_name=datos.full_name,
                    email=datos.email.lower(),
                    hashed_password=hash_password(datos.password),
                    role="user",
                )
            )
            return UserPublic.model_validate(usuario)

    def autenticar(self, username: str, password: str) -> Usuario:
        """Valida credenciales: 401 si no coinciden, 400 si la cuenta está desactivada."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
        # Mismo mensaje para usuario inexistente y contraseña incorrecta:
        # no se revela cuál de los dos datos falló
        if usuario is None or not verify_password(password, usuario.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos",
            )
        if usuario.disabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cuenta de usuario desactivada"
            )
        return usuario
