from collections import defaultdict

from sqlmodel import select

from app.core.repository import BaseRepository
from app.modules.categorias.models import Categoria
from app.modules.ingredientes.models import Ingrediente
from app.modules.productos.models import Producto, ProductoCategoria, ProductoIngrediente


class ProductoRepository(BaseRepository[Producto]):
    model = Producto

    def listar(
        self, categoria_id: int | None = None, solo_disponibles: bool = False
    ) -> list[Producto]:
        stmt = select(Producto).where(Producto.deleted_at.is_(None))  # type: ignore[union-attr]
        if categoria_id is not None:
            stmt = stmt.join(
                ProductoCategoria,
                ProductoCategoria.producto_id == Producto.id,  # type: ignore[arg-type]
            ).where(
                ProductoCategoria.categoria_id == categoria_id,
                ProductoCategoria.deleted_at.is_(None),  # type: ignore[union-attr]
            )
        if solo_disponibles:
            stmt = stmt.where(Producto.disponible == True)  # noqa: E712
        return list(self.session.exec(stmt.order_by(Producto.nombre)).all())

    def categorias_de(self, producto_ids: list[int]) -> dict[int, list[Categoria]]:
        """Categorías activas de varios productos en UNA consulta (la principal primero)."""
        if not producto_ids:
            return {}
        stmt = (
            select(ProductoCategoria.producto_id, Categoria)
            .join(Categoria, Categoria.id == ProductoCategoria.categoria_id)  # type: ignore[arg-type]
            .where(
                ProductoCategoria.producto_id.in_(producto_ids),  # type: ignore[attr-defined]
                ProductoCategoria.deleted_at.is_(None),  # type: ignore[union-attr]
                Categoria.deleted_at.is_(None),  # type: ignore[union-attr]
            )
            .order_by(ProductoCategoria.es_principal.desc(), Categoria.nombre)  # type: ignore[attr-defined]
        )
        resultado: dict[int, list[Categoria]] = defaultdict(list)
        for producto_id, categoria in self.session.exec(stmt).all():
            resultado[producto_id].append(categoria)
        return resultado

    def ingredientes_de(self, producto_ids: list[int]) -> dict[int, list[Ingrediente]]:
        """Ingredientes activos de varios productos en UNA consulta."""
        if not producto_ids:
            return {}
        stmt = (
            select(ProductoIngrediente.producto_id, Ingrediente)
            .join(Ingrediente, Ingrediente.id == ProductoIngrediente.ingrediente_id)  # type: ignore[arg-type]
            .where(
                ProductoIngrediente.producto_id.in_(producto_ids),  # type: ignore[attr-defined]
                ProductoIngrediente.deleted_at.is_(None),  # type: ignore[union-attr]
                Ingrediente.deleted_at.is_(None),  # type: ignore[union-attr]
            )
            .order_by(Ingrediente.nombre)
        )
        resultado: dict[int, list[Ingrediente]] = defaultdict(list)
        for producto_id, ingrediente in self.session.exec(stmt).all():
            resultado[producto_id].append(ingrediente)
        return resultado


class ProductoCategoriaRepository(BaseRepository[ProductoCategoria]):
    model = ProductoCategoria

    def de_producto(
        self, producto_id: int, incluir_borrados: bool = False
    ) -> list[ProductoCategoria]:
        stmt = select(ProductoCategoria).where(ProductoCategoria.producto_id == producto_id)
        if not incluir_borrados:
            stmt = stmt.where(ProductoCategoria.deleted_at.is_(None))  # type: ignore[union-attr]
        return list(self.session.exec(stmt.order_by(ProductoCategoria.created_at)).all())

    def obtener(self, producto_id: int, categoria_id: int) -> ProductoCategoria | None:
        """Vínculo activo (None si no existe o tiene borrado lógico)."""
        return self.get_by_id((producto_id, categoria_id))

    def obtener_incluso_borrado(
        self, producto_id: int, categoria_id: int
    ) -> ProductoCategoria | None:
        return self.session.get(ProductoCategoria, (producto_id, categoria_id))


class ProductoIngredienteRepository(BaseRepository[ProductoIngrediente]):
    model = ProductoIngrediente

    def de_producto(
        self, producto_id: int, incluir_borrados: bool = False
    ) -> list[ProductoIngrediente]:
        stmt = select(ProductoIngrediente).where(ProductoIngrediente.producto_id == producto_id)
        if not incluir_borrados:
            stmt = stmt.where(ProductoIngrediente.deleted_at.is_(None))  # type: ignore[union-attr]
        return list(self.session.exec(stmt).all())
