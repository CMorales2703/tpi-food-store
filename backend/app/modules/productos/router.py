from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_active_user, require_role
from app.core.exceptions import DominioError, a_http
from app.modules.productos.schemas import (
    ProductoCategoriaCreate,
    ProductoCategoriaRead,
    ProductoCategoriaUpdate,
    ProductoCreate,
    ProductoRead,
    ProductoUpdate,
)
from app.modules.productos.service import ProductoCategoriaService, ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork

# RN-07: lectura para cualquier usuario autenticado (y con la cuenta activa)
router = APIRouter(
    prefix="/productos",
    tags=["productos"],
    dependencies=[Depends(get_current_active_user)],
)

# RN-04: las escrituras exigen el rol admin (403 para un user)
SOLO_ADMIN = [Depends(require_role(["admin"]))]


def get_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork())


def get_vinculo_service() -> ProductoCategoriaService:
    return ProductoCategoriaService(ProductoUnitOfWork())


# ===================== Producto =====================
@router.get("/", response_model=list[ProductoRead])
def listar_productos(
    categoria_id: Optional[int] = Query(default=None, description="Filtrar por categoría"),
    disponibles: bool = Query(default=False, description="Sólo productos disponibles"),
    service: ProductoService = Depends(get_service),
):
    return service.listar(categoria_id=categoria_id, solo_disponibles=disponibles)


@router.get("/{producto_id}", response_model=ProductoRead)
def obtener_producto(producto_id: int, service: ProductoService = Depends(get_service)):
    try:
        return service.obtener(producto_id)
    except DominioError as e:
        raise a_http(e)


@router.post(
    "/", response_model=ProductoRead, status_code=status.HTTP_201_CREATED, dependencies=SOLO_ADMIN
)
def crear_producto(datos: ProductoCreate, service: ProductoService = Depends(get_service)):
    try:
        return service.crear(datos)
    except DominioError as e:
        raise a_http(e)


@router.put("/{producto_id}", response_model=ProductoRead, dependencies=SOLO_ADMIN)
def actualizar_producto(
    producto_id: int, datos: ProductoUpdate, service: ProductoService = Depends(get_service)
):
    try:
        return service.actualizar(producto_id, datos)
    except DominioError as e:
        raise a_http(e)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=SOLO_ADMIN)
def eliminar_producto(producto_id: int, service: ProductoService = Depends(get_service)):
    try:
        service.eliminar(producto_id)
    except DominioError as e:
        raise a_http(e)


# ============ ProductoCategoria (recurso anidado) ============
@router.get(
    "/{producto_id}/categorias/",
    response_model=list[ProductoCategoriaRead],
    tags=["producto-categoria"],
)
def listar_categorias_de_producto(
    producto_id: int, service: ProductoCategoriaService = Depends(get_vinculo_service)
):
    try:
        return service.listar(producto_id)
    except DominioError as e:
        raise a_http(e)


@router.post(
    "/{producto_id}/categorias/",
    response_model=ProductoCategoriaRead,
    status_code=status.HTTP_201_CREATED,
    tags=["producto-categoria"],
    dependencies=SOLO_ADMIN,
)
def asociar_categoria(
    producto_id: int,
    datos: ProductoCategoriaCreate,
    service: ProductoCategoriaService = Depends(get_vinculo_service),
):
    try:
        return service.asociar(producto_id, datos)
    except DominioError as e:
        raise a_http(e)


@router.patch(
    "/{producto_id}/categorias/{categoria_id}",
    response_model=ProductoCategoriaRead,
    tags=["producto-categoria"],
    dependencies=SOLO_ADMIN,
)
def cambiar_principal(
    producto_id: int,
    categoria_id: int,
    datos: ProductoCategoriaUpdate,
    service: ProductoCategoriaService = Depends(get_vinculo_service),
):
    try:
        return service.actualizar(producto_id, categoria_id, datos)
    except DominioError as e:
        raise a_http(e)


@router.delete(
    "/{producto_id}/categorias/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["producto-categoria"],
    dependencies=SOLO_ADMIN,
)
def desasociar_categoria(
    producto_id: int,
    categoria_id: int,
    service: ProductoCategoriaService = Depends(get_vinculo_service),
):
    try:
        service.desasociar(producto_id, categoria_id)
    except DominioError as e:
        raise a_http(e)
