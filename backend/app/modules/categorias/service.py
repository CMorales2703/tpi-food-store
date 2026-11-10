"""Reglas de negocio de Categoría.

- Nombre único sin distinguir mayúsculas, también contra las dadas de baja
  (la baja lógica NO libera el nombre) → NombreDuplicado (409).
- Una categoría dada de baja se trata como inexistente: detalle, PUT y DELETE → 404.
- La baja NO oculta sus productos: para retirarlos se dan de baja los productos.
"""

from app.core.exceptions import ConflictoNegocio, RecursoNoEncontrado
from app.modules.categorias.models import Categoria
from app.modules.categorias.repository import CategoriaRepository
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(RecursoNoEncontrado):
    def __init__(self, categoria_id: int) -> None:
        super().__init__(f"Categoría {categoria_id} no encontrada")


class NombreDuplicado(ConflictoNegocio):
    def __init__(self, nombre: str) -> None:
        super().__init__(f"Ya existe una categoría llamada '{nombre}'")


def obtener_activa(repo: CategoriaRepository, categoria_id: int) -> Categoria:
    """Devuelve la categoría si existe y está activa; si no, CategoriaNoEncontrada.
    La usa también el Service de productos para validar categoria_id."""
    categoria = repo.get_by_id(categoria_id)
    if categoria is None or not categoria.activo:
        raise CategoriaNoEncontrada(categoria_id)
    return categoria


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(obtener_activa(uow.categorias, categoria_id))

    def crear(self, datos: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            if uow.categorias.get_by_nombre(datos.nombre) is not None:
                raise NombreDuplicado(datos.nombre)
            categoria = uow.categorias.add(Categoria.model_validate(datos))
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, datos: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = obtener_activa(uow.categorias, categoria_id)
            # exclude_unset: solo lo que vino en el body (actualización parcial)
            cambios = datos.model_dump(exclude_unset=True, exclude_none=True)
            if "nombre" in cambios:
                otra = uow.categorias.get_by_nombre(cambios["nombre"])
                if otra is not None and otra.id != categoria_id:
                    raise NombreDuplicado(cambios["nombre"])
            categoria.sqlmodel_update(cambios)  # el commit del Unit of Work lo persiste
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        """Baja lógica: activo = False."""
        with self.uow as uow:
            categoria = obtener_activa(uow.categorias, categoria_id)
            categoria.activo = False
