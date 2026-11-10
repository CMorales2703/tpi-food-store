from app.core.unit_of_work import BaseUnitOfWork
from app.modules.ingredientes.repository import IngredienteRepository


class IngredienteUnitOfWork(BaseUnitOfWork):
    ingredientes: IngredienteRepository

    def _crear_repositorios(self) -> None:
        self.ingredientes = IngredienteRepository(self.session)
