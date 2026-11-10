from app.core.unit_of_work import BaseUnitOfWork
from app.modules.categorias.repository import CategoriaRepository
from app.modules.ingredientes.repository import IngredienteRepository
from app.modules.productos.repository import (
    ProductoCategoriaRepository,
    ProductoIngredienteRepository,
    ProductoRepository,
)


class ProductoUnitOfWork(BaseUnitOfWork):
    """Expone los repositorios que necesitan los casos de uso de Producto:
    el producto, sus dos tablas de enlace y las categorías e ingredientes (para validarlos)."""

    productos: ProductoRepository
    vinculos: ProductoCategoriaRepository
    producto_ingredientes: ProductoIngredienteRepository
    categorias: CategoriaRepository
    ingredientes: IngredienteRepository

    def _crear_repositorios(self) -> None:
        self.productos = ProductoRepository(self.session)
        self.vinculos = ProductoCategoriaRepository(self.session)
        self.producto_ingredientes = ProductoIngredienteRepository(self.session)
        self.categorias = CategoriaRepository(self.session)
        self.ingredientes = IngredienteRepository(self.session)
