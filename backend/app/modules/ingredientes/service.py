from app.core.exceptions import ConflictoNegocio, RecursoNoEncontrado
from app.modules.ingredientes.models import Ingrediente
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteRead,
    IngredienteUpdate,
)
from app.modules.ingredientes.unit_of_work import IngredienteUnitOfWork


class IngredienteNoEncontrado(RecursoNoEncontrado):
    def __init__(self, ingrediente_id: int) -> None:
        super().__init__(f"Ingrediente {ingrediente_id} no encontrado")


class IngredienteDuplicado(ConflictoNegocio):
    def __init__(self, nombre: str) -> None:
        super().__init__(f"Ya existe un ingrediente llamado '{nombre}'")


class IngredienteService:
    """Reglas de negocio de Ingrediente (RN-10, RN-11). Borrado lógico con deleted_at."""

    def __init__(self, uow: IngredienteUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _obtener(uow: IngredienteUnitOfWork, ingrediente_id: int) -> Ingrediente:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if ingrediente is None:
            raise IngredienteNoEncontrado(ingrediente_id)  # RN-11
        return ingrediente

    def listar(self) -> list[IngredienteRead]:
        with self.uow as uow:
            return [IngredienteRead.model_validate(i) for i in uow.ingredientes.listar()]

    def obtener(self, ingrediente_id: int) -> IngredienteRead:
        with self.uow as uow:
            return IngredienteRead.model_validate(self._obtener(uow, ingrediente_id))

    def crear(self, datos: IngredienteCreate) -> IngredienteRead:
        with self.uow as uow:
            existente = uow.ingredientes.buscar_por_nombre(datos.nombre)
            if existente is not None and existente.deleted_at is None:
                raise IngredienteDuplicado(datos.nombre)  # RN-10 (409 opcional)
            if existente is not None:
                # Nombre UNIQUE en la tabla: si estaba borrado, se reactiva
                ingrediente = uow.ingredientes.update(
                    existente, {"nombre": datos.nombre, "deleted_at": None}
                )
            else:
                ingrediente = uow.ingredientes.create(Ingrediente(nombre=datos.nombre))
            return IngredienteRead.model_validate(ingrediente)

    def actualizar(self, ingrediente_id: int, datos: IngredienteUpdate) -> IngredienteRead:
        with self.uow as uow:
            ingrediente = self._obtener(uow, ingrediente_id)
            otro = uow.ingredientes.buscar_por_nombre(datos.nombre)
            if otro is not None and otro.id != ingrediente_id:
                raise IngredienteDuplicado(datos.nombre)
            ingrediente = uow.ingredientes.update(ingrediente, {"nombre": datos.nombre})
            return IngredienteRead.model_validate(ingrediente)

    def eliminar(self, ingrediente_id: int) -> None:
        with self.uow as uow:
            uow.ingredientes.soft_delete(self._obtener(uow, ingrediente_id))
