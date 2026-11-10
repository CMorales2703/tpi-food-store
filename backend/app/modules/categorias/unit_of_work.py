from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository


class CategoriaUnitOfWork(UnitOfWork):
    categorias: CategoriaRepository

    def _crear_repositorios(self) -> None:
        self.categorias = CategoriaRepository(self.session)
