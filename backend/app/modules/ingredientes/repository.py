from sqlmodel import func, select

from app.core.repository import BaseRepository
from app.modules.ingredientes.models import Ingrediente


class IngredienteRepository(BaseRepository[Ingrediente]):
    model = Ingrediente

    def listar(self) -> list[Ingrediente]:
        return self.list_all(order_by=Ingrediente.nombre)

    def buscar_por_nombre(self, nombre: str) -> Ingrediente | None:
        """Búsqueda sin distinguir mayúsculas. Incluye los borrados lógicamente."""
        stmt = select(Ingrediente).where(func.lower(Ingrediente.nombre) == nombre.lower())
        return self.session.exec(stmt).first()
