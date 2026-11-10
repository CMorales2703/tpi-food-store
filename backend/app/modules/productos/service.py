"""Reglas de negocio de Producto.

- Un producto dado de baja (activo = False) se trata como inexistente:
  detalle, PUT, PATCH y DELETE → ProductoNoEncontrado (404).
- La categoría debe existir y estar activa, al crear y al cambiarla → CategoriaNoEncontrada (404).
"""

from typing import Optional

from app.core.exceptions import RecursoNoEncontrado
from app.modules.categorias.service import obtener_activa as obtener_categoria_activa
from app.modules.productos.models import Producto
from app.modules.productos.repository import ProductoRepository
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(RecursoNoEncontrado):
    def __init__(self, producto_id: int) -> None:
        super().__init__(f"Producto {producto_id} no encontrado")


def obtener_activo(repo: ProductoRepository, producto_id: int) -> Producto:
    producto = repo.get_by_id(producto_id)
    if producto is None or not producto.activo:
        raise ProductoNoEncontrado(producto_id)
    return producto


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    def listar(
        self,
        skip: int,
        limit: int,
        search: Optional[str],
        categoria_id: Optional[int],
        disponible: Optional[bool],
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, productos = uow.productos.search(skip, limit, search, categoria_id, disponible)
            return ProductosPaginados(
                total=total, items=[ProductoRead.model_validate(p) for p in productos]
            )

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(obtener_activo(uow.productos, producto_id))

    def crear(self, datos: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            obtener_categoria_activa(uow.categorias, datos.categoria_id)
            producto = uow.productos.add(Producto.model_validate(datos))
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, datos: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = obtener_activo(uow.productos, producto_id)
            cambios = datos.model_dump(exclude_unset=True, exclude_none=True)
            if "categoria_id" in cambios:
                categoria = obtener_categoria_activa(uow.categorias, cambios.pop("categoria_id"))
                # Se asignan la FK y la relación: así la respuesta ya muestra la nueva categoría
                producto.categoria_id = categoria.id  # type: ignore[assignment]
                producto.categoria = categoria
            producto.sqlmodel_update(cambios)
            return ProductoRead.model_validate(producto)

    def actualizar_stock(self, producto_id: int, datos: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = obtener_activo(uow.productos, producto_id)
            producto.stock = datos.stock
            producto.disponible = datos.disponible
            return ProductoRead.model_validate(producto)

    def eliminar(self, producto_id: int) -> None:
        """Baja lógica: activo = False."""
        with self.uow as uow:
            producto = obtener_activo(uow.productos, producto_id)
            producto.activo = False
