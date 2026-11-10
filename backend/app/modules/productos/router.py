"""Productos: lecturas públicas (solo activos); escrituras solo para admin."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.deps import require_role
from app.core.exceptions import DominioError, a_http
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork

router = APIRouter(prefix="/productos", tags=["productos"])

SOLO_ADMIN = [Depends(require_role(["admin"]))]


def get_productos_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork())


ServicioProductos = Annotated[ProductoService, Depends(get_productos_service)]


@router.get("", response_model=ProductosPaginados)
def listar_productos(
    service: ServicioProductos,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    search: Annotated[Optional[str], Query(description="Busca en el nombre")] = None,
    categoria_id: Optional[int] = None,
    disponible: Optional[bool] = None,
):
    return service.listar(skip, limit, search, categoria_id, disponible)


@router.get("/{producto_id}", response_model=ProductoRead)
def obtener_producto(producto_id: int, service: ServicioProductos):
    try:
        return service.obtener(producto_id)
    except DominioError as e:
        raise a_http(e)  # 404


@router.post(
    "",
    response_model=ProductoRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=SOLO_ADMIN,
)
def crear_producto(datos: ProductoCreate, service: ServicioProductos):
    try:
        return service.crear(datos)
    except DominioError as e:
        raise a_http(e)  # 404 categoría inexistente o dada de baja


@router.put("/{producto_id}", response_model=ProductoRead, dependencies=SOLO_ADMIN)
def actualizar_producto(producto_id: int, datos: ProductoUpdate, service: ServicioProductos):
    try:
        return service.actualizar(producto_id, datos)
    except DominioError as e:
        raise a_http(e)  # 404 producto o nueva categoría


@router.patch("/{producto_id}/stock", response_model=ProductoRead, dependencies=SOLO_ADMIN)
def actualizar_stock(producto_id: int, datos: ProductoStockUpdate, service: ServicioProductos):
    try:
        return service.actualizar_stock(producto_id, datos)
    except DominioError as e:
        raise a_http(e)  # 404


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    dependencies=SOLO_ADMIN,
)
def eliminar_producto(producto_id: int, service: ServicioProductos):
    try:
        service.eliminar(producto_id)
    except DominioError as e:
        raise a_http(e)  # 404
