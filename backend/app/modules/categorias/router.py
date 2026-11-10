"""Categorías: lecturas públicas (solo activas); escrituras solo para admin."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.core.deps import require_role
from app.core.exceptions import DominioError, a_http
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaService
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

router = APIRouter(prefix="/categorias", tags=["categorias"])

SOLO_ADMIN = [Depends(require_role(["admin"]))]


def get_categorias_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


ServicioCategorias = Annotated[CategoriaService, Depends(get_categorias_service)]


@router.get("", response_model=list[CategoriaRead])
def listar_categorias(service: ServicioCategorias):
    return service.listar()


@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener_categoria(categoria_id: int, service: ServicioCategorias):
    try:
        return service.obtener(categoria_id)
    except DominioError as e:
        raise a_http(e)  # 404


@router.post(
    "",
    response_model=CategoriaRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=SOLO_ADMIN,
)
def crear_categoria(datos: CategoriaCreate, service: ServicioCategorias):
    try:
        return service.crear(datos)
    except DominioError as e:
        raise a_http(e)  # 409


@router.put("/{categoria_id}", response_model=CategoriaRead, dependencies=SOLO_ADMIN)
def actualizar_categoria(categoria_id: int, datos: CategoriaUpdate, service: ServicioCategorias):
    try:
        return service.actualizar(categoria_id, datos)
    except DominioError as e:
        raise a_http(e)  # 404, 409


@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    dependencies=SOLO_ADMIN,
)
def eliminar_categoria(categoria_id: int, service: ServicioCategorias):
    try:
        service.eliminar(categoria_id)
    except DominioError as e:
        raise a_http(e)  # 404
