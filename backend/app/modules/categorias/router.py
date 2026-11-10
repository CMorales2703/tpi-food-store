from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_active_user, require_role
from app.core.exceptions import DominioError, a_http
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaService
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

# RN-07: lectura para cualquier usuario autenticado (y con la cuenta activa)
router = APIRouter(
    prefix="/categorias",
    tags=["categorias"],
    dependencies=[Depends(get_current_active_user)],
)

# RN-04: las escrituras exigen el rol admin (403 para un user)
SOLO_ADMIN = [Depends(require_role(["admin"]))]


def get_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


@router.get("/", response_model=list[CategoriaRead])
def listar_categorias(service: CategoriaService = Depends(get_service)):
    return service.listar()


@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener_categoria(categoria_id: int, service: CategoriaService = Depends(get_service)):
    try:
        return service.obtener(categoria_id)
    except DominioError as e:
        raise a_http(e)


@router.post(
    "/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED, dependencies=SOLO_ADMIN
)
def crear_categoria(datos: CategoriaCreate, service: CategoriaService = Depends(get_service)):
    try:
        return service.crear(datos)
    except DominioError as e:
        raise a_http(e)


@router.put("/{categoria_id}", response_model=CategoriaRead, dependencies=SOLO_ADMIN)
def actualizar_categoria(
    categoria_id: int,
    datos: CategoriaUpdate,
    service: CategoriaService = Depends(get_service),
):
    try:
        return service.actualizar(categoria_id, datos)
    except DominioError as e:
        raise a_http(e)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=SOLO_ADMIN)
def eliminar_categoria(categoria_id: int, service: CategoriaService = Depends(get_service)):
    try:
        service.eliminar(categoria_id)
    except DominioError as e:
        raise a_http(e)
