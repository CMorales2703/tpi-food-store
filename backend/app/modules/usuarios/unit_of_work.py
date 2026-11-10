from app.core.unit_of_work import BaseUnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(BaseUnitOfWork):
    usuarios: UsuarioRepository

    def _crear_repositorios(self) -> None:
        self.usuarios = UsuarioRepository(self.session)
