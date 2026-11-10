from app.core.unit_of_work import BaseUnitOfWork
from app.modules.categorias.repository import CategoriaRepository


class CategoriaUnitOfWork(BaseUnitOfWork):
    categorias: CategoriaRepository

    def _crear_repositorios(self) -> None:
        self.categorias = CategoriaRepository(self.session)
