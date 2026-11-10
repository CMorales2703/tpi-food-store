from app.core.exceptions import ConflictoNegocio, RecursoNoEncontrado
from app.modules.categorias.models import Categoria
from app.modules.categorias.repository import CategoriaRepository
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(RecursoNoEncontrado):
    def __init__(self, categoria_id: int) -> None:
        super().__init__(f"Categoría {categoria_id} no encontrada")


class CategoriaDuplicada(ConflictoNegocio):
    def __init__(self, nombre: str) -> None:
        super().__init__(f"Ya existe una categoría llamada '{nombre}'")


class CategoriaEnUso(ConflictoNegocio):
    def __init__(self, cantidad: int) -> None:
        super().__init__(
            f"No se puede eliminar: la categoría tiene {cantidad} producto(s) asociado(s)"
        )


class CategoriaService:
    """Reglas de negocio de Categoría (RN-01 a RN-05). Borrado lógico con deleted_at."""

    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _obtener(repo: CategoriaRepository, categoria_id: int) -> Categoria:
        categoria = repo.get_by_id(categoria_id)
        if categoria is None:
            raise CategoriaNoEncontrada(categoria_id)  # RN-04
        return categoria

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.listar()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(self._obtener(uow.categorias, categoria_id))

    def crear(self, datos: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            existente = uow.categorias.buscar_por_nombre(datos.nombre)
            if existente is not None and existente.deleted_at is None:
                raise CategoriaDuplicada(datos.nombre)  # RN-02
            if existente is not None:
                # El nombre es UNIQUE en la tabla: si estaba borrada, se reactiva
                categoria = uow.categorias.update(
                    existente,
                    {"nombre": datos.nombre, "descripcion": datos.descripcion, "deleted_at": None},
                )
            else:
                categoria = uow.categorias.create(Categoria(**datos.model_dump()))
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, datos: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._obtener(uow.categorias, categoria_id)
            cambios = datos.model_dump(exclude_unset=True, exclude_none=True)
            if "nombre" in cambios:
                otra = uow.categorias.buscar_por_nombre(cambios["nombre"])
                if otra is not None and otra.id != categoria_id:
                    raise CategoriaDuplicada(cambios["nombre"])  # RN-02
            categoria = uow.categorias.update(categoria, cambios)
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        with self.uow as uow:
            categoria = self._obtener(uow.categorias, categoria_id)
            en_uso = uow.categorias.contar_productos_activos(categoria_id)
            if en_uso > 0:
                raise CategoriaEnUso(en_uso)  # RN-05
            uow.categorias.soft_delete(categoria)
