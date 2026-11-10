from collections.abc import Sequence

from sqlmodel import col, func, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    model = Categoria

    def list_activas(self) -> Sequence[Categoria]:
        stmt = select(Categoria).where(col(Categoria.activo).is_(True)).order_by(Categoria.nombre)
        return self.session.exec(stmt).all()

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        """Sin distinguir mayúsculas. Incluye las dadas de baja: su nombre sigue ocupado."""
        stmt = select(Categoria).where(func.lower(Categoria.nombre) == nombre.lower())
        return self.session.exec(stmt).first()
