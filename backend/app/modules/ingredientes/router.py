from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_active_user, require_role
from app.core.exceptions import DominioError, a_http
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteRead,
    IngredienteUpdate,
)
from app.modules.ingredientes.service import IngredienteService
from app.modules.ingredientes.unit_of_work import IngredienteUnitOfWork

# RN-07: lectura para cualquier usuario autenticado (y con la cuenta activa)
router = APIRouter(
    prefix="/ingredientes",
    tags=["ingredientes"],
    dependencies=[Depends(get_current_active_user)],
)

# RN-04: las escrituras exigen el rol admin (403 para un user)
SOLO_ADMIN = [Depends(require_role(["admin"]))]


def get_service() -> IngredienteService:
    return IngredienteService(IngredienteUnitOfWork())


@router.get("/", response_model=list[IngredienteRead])
def listar_ingredientes(service: IngredienteService = Depends(get_service)):
    return service.listar()


@router.get("/{ingrediente_id}", response_model=IngredienteRead)
def obtener_ingrediente(ingrediente_id: int, service: IngredienteService = Depends(get_service)):
    try:
        return service.obtener(ingrediente_id)
    except DominioError as e:
        raise a_http(e)


@router.post(
    "/",
    response_model=IngredienteRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=SOLO_ADMIN,
)
def crear_ingrediente(datos: IngredienteCreate, service: IngredienteService = Depends(get_service)):
    try:
        return service.crear(datos)
    except DominioError as e:
        raise a_http(e)


@router.put("/{ingrediente_id}", response_model=IngredienteRead, dependencies=SOLO_ADMIN)
def actualizar_ingrediente(
    ingrediente_id: int,
    datos: IngredienteUpdate,
    service: IngredienteService = Depends(get_service),
):
    try:
        return service.actualizar(ingrediente_id, datos)
    except DominioError as e:
        raise a_http(e)


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=SOLO_ADMIN)
def eliminar_ingrediente(ingrediente_id: int, service: IngredienteService = Depends(get_service)):
    try:
        service.eliminar(ingrediente_id)
    except DominioError as e:
        raise a_http(e)
