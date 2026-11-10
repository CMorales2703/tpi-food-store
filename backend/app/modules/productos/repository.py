from collections.abc import Sequence
from typing import Any, Optional

from sqlalchemy.orm import selectinload
from sqlmodel import col, func, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    model = Producto

    def search(
        self,
        skip: int,
        limit: int,
        search: Optional[str] = None,
        categoria_id: Optional[int] = None,
        disponible: Optional[bool] = None,
    ) -> tuple[int, Sequence[Producto]]:
        """Productos ACTIVOS filtrados y paginados. Devuelve (total sin paginar, página)."""
        filtros: list[Any] = [col(Producto.activo).is_(True)]
        if search:
            # Sin distinguir mayúsculas; autoescape: un "%" o "_" buscado se toma literal
            filtros.append(
                func.lower(Producto.nombre).contains(search.strip().lower(), autoescape=True)
            )
        if categoria_id is not None:
            filtros.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            filtros.append(Producto.disponible == disponible)

        total = self.session.exec(select(func.count()).select_from(Producto).where(*filtros)).one()
        stmt = (
            select(Producto)
            .where(*filtros)
            # selectinload: trae las categorías de toda la página en UNA consulta más
            # (sin esto, ProductoRead cargaría la categoría producto por producto)
            .options(selectinload(Producto.categoria))  # type: ignore[arg-type]
            .order_by(Producto.nombre, Producto.id)
            .offset(skip)
            .limit(limit)
        )
        return total, self.session.exec(stmt).all()
