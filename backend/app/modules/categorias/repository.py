from sqlmodel import func, select

from app.core.repository import BaseRepository
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto, ProductoCategoria


class CategoriaRepository(BaseRepository[Categoria]):
    model = Categoria

    def listar(self) -> list[Categoria]:
        return self.list_all(order_by=Categoria.nombre)

    def buscar_por_nombre(self, nombre: str) -> Categoria | None:
        """Búsqueda sin distinguir mayúsculas. Incluye las borradas lógicamente."""
        stmt = select(Categoria).where(func.lower(Categoria.nombre) == nombre.lower())
        return self.session.exec(stmt).first()

    def contar_productos_activos(self, categoria_id: int) -> int:
        stmt = (
            select(func.count())
            .select_from(ProductoCategoria)
            .join(Producto, Producto.id == ProductoCategoria.producto_id)  # type: ignore[arg-type]
            .where(
                ProductoCategoria.categoria_id == categoria_id,
                ProductoCategoria.deleted_at.is_(None),  # type: ignore[union-attr]
                Producto.deleted_at.is_(None),  # type: ignore[union-attr]
            )
        )
        return self.session.exec(stmt).one()
