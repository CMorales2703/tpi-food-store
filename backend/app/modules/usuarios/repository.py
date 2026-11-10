from sqlmodel import func, select

from app.core.repository import BaseRepository
from app.modules.usuarios.models import Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    model = Usuario

    def listar(self) -> list[Usuario]:
        """Todos los usuarios, activos y desactivados (los ve el admin para gestionarlos)."""
        return list(self.session.exec(select(Usuario).order_by(Usuario.id)).all())

    def buscar_por_username(self, username: str) -> Usuario | None:
        """Sin distinguir mayúsculas: 'Admin' y 'admin' son el mismo usuario."""
        stmt = select(Usuario).where(func.lower(Usuario.username) == username.lower())
        return self.session.exec(stmt).first()

    def buscar_por_email(self, email: str) -> Usuario | None:
        stmt = select(Usuario).where(func.lower(Usuario.email) == email.lower())
        return self.session.exec(stmt).first()
