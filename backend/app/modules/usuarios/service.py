from fastapi import HTTPException, status

from app.core.exceptions import ConflictoNegocio, RecursoNoEncontrado
from app.core.security import hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioNoEncontrado(RecursoNoEncontrado):
    def __init__(self, usuario_id: int) -> None:
        super().__init__(f"Usuario {usuario_id} no encontrado")


# En auth y usuarios el enunciado admite lanzar HTTPException desde el Service.
# Mismo mensaje para usuario inexistente y contraseña incorrecta:
# no se revela cuál de los dos datos falló.
CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos"


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    # ---------- registro y login ----------
    def registrar(self, datos: UserCreate, role: str = "user") -> UserPublic:
        """RN-08: el registro público siempre asigna el rol user.
        (El parámetro role sólo lo usa seed.py para crear el admin inicial.)"""
        with self.uow as uow:
            if uow.usuarios.get_by_username(datos.username) is not None:
                raise ConflictoNegocio(f"El usuario '{datos.username}' ya existe")  # RN-02
            if uow.usuarios.get_by_email(datos.email) is not None:
                raise ConflictoNegocio(f"El email '{datos.email}' ya está registrado")  # RN-02
            usuario = uow.usuarios.add(
                Usuario(
                    username=datos.username,
                    full_name=datos.full_name,
                    email=datos.email.lower(),
                    hashed_password=hash_password(datos.password),  # RN-01
                    role=role,
                )
            )
            return UserPublic.model_validate(usuario)

    def autenticar(self, username: str, password: str) -> Usuario:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
        if usuario is None or not verify_password(password, usuario.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=CREDENCIALES_INVALIDAS
            )
        if usuario.disabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cuenta de usuario desactivada"
            )
        return usuario

    # ---------- administración (sólo admin) ----------
    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.listar()]

    def cambiar_estado(self, usuario_id: int, disabled: bool, actor: Usuario) -> UserPublic:
        """Activar (disabled=False) o desactivar (disabled=True) una cuenta."""
        if disabled and usuario_id == actor.id:
            raise ConflictoNegocio("No podés desactivar tu propia cuenta")
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado(usuario_id)
            usuario.disabled = disabled  # el commit del UoW lo persiste
            return UserPublic.model_validate(usuario)
