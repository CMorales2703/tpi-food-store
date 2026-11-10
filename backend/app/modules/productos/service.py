from app.core.exceptions import ConflictoNegocio, RecursoNoEncontrado
from app.modules.categorias.schemas import CategoriaRead
from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.ingredientes.schemas import IngredienteRead
from app.modules.ingredientes.service import IngredienteNoEncontrado
from app.modules.productos.models import Producto, ProductoCategoria, ProductoIngrediente
from app.modules.productos.schemas import (
    ProductoCategoriaCreate,
    ProductoCategoriaRead,
    ProductoCategoriaUpdate,
    ProductoCreate,
    ProductoRead,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(RecursoNoEncontrado):
    def __init__(self, producto_id: int) -> None:
        super().__init__(f"Producto {producto_id} no encontrado")


class VinculoNoEncontrado(RecursoNoEncontrado):
    def __init__(self, producto_id: int, categoria_id: int) -> None:
        super().__init__(f"La categoría {categoria_id} no está asociada al producto {producto_id}")


def a_respuestas(uow: ProductoUnitOfWork, productos: list[Producto]) -> list[ProductoRead]:
    """Arma las respuestas con las categorías e ingredientes activos de cada producto
    (dos consultas en total, sin importar cuántos productos haya)."""
    ids = [p.id for p in productos if p.id is not None]
    categorias = uow.productos.categorias_de(ids)
    ingredientes = uow.productos.ingredientes_de(ids)
    return [
        ProductoRead(
            id=p.id,  # type: ignore[arg-type]
            nombre=p.nombre,
            descripcion=p.descripcion,
            precio_base=float(p.precio_base),
            imagenes_url=list(p.imagenes_url),
            disponible=p.disponible,
            created_at=p.created_at,
            updated_at=p.updated_at,
            categorias=[CategoriaRead.model_validate(c) for c in categorias.get(p.id, [])],  # type: ignore[arg-type]
            ingredientes=[
                IngredienteRead.model_validate(i)
                for i in ingredientes.get(p.id, [])  # type: ignore[arg-type]
            ],
        )
        for p in productos
    ]


class ProductoService:
    """Reglas de negocio de Producto (RN-06 a RN-09). Borrado lógico con deleted_at."""

    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    # ---------- helpers ----------
    @staticmethod
    def _obtener(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        producto = uow.productos.get_by_id(producto_id)
        if producto is None:
            raise ProductoNoEncontrado(producto_id)  # RN-09
        return producto

    @staticmethod
    def _asignar_categorias(
        uow: ProductoUnitOfWork, producto_id: int, categoria_ids: list[int]
    ) -> None:
        """Deja activas exactamente esas categorías (la primera, principal).
        Los vínculos que sobran reciben borrado lógico; los que vuelven se reactivan."""
        ids = list(dict.fromkeys(categoria_ids))  # sin duplicados, respeta el orden
        for cid in ids:
            if uow.categorias.get_by_id(cid) is None:
                raise CategoriaNoEncontrada(cid)
        existentes = {
            v.categoria_id: v for v in uow.vinculos.de_producto(producto_id, incluir_borrados=True)
        }
        for cid, vinculo in existentes.items():
            if cid not in ids and vinculo.deleted_at is None:
                uow.vinculos.soft_delete(vinculo)
        for i, cid in enumerate(ids):
            if cid in existentes:
                uow.vinculos.update(existentes[cid], {"es_principal": i == 0, "deleted_at": None})
            else:
                uow.vinculos.create(
                    ProductoCategoria(
                        producto_id=producto_id, categoria_id=cid, es_principal=(i == 0)
                    )
                )

    @staticmethod
    def _asignar_ingredientes(
        uow: ProductoUnitOfWork, producto_id: int, ingrediente_ids: list[int]
    ) -> None:
        """Igual que las categorías, para la relación ProductoIngrediente."""
        ids = list(dict.fromkeys(ingrediente_ids))
        for iid in ids:
            if uow.ingredientes.get_by_id(iid) is None:
                raise IngredienteNoEncontrado(iid)
        existentes = {
            v.ingrediente_id: v
            for v in uow.producto_ingredientes.de_producto(producto_id, incluir_borrados=True)
        }
        for iid, vinculo in existentes.items():
            if iid not in ids and vinculo.deleted_at is None:
                uow.producto_ingredientes.soft_delete(vinculo)
        for iid in ids:
            if iid in existentes:
                uow.producto_ingredientes.update(existentes[iid], {"deleted_at": None})
            else:
                uow.producto_ingredientes.create(
                    ProductoIngrediente(producto_id=producto_id, ingrediente_id=iid)
                )

    # ---------- CRUD ----------
    def listar(
        self, categoria_id: int | None = None, solo_disponibles: bool = False
    ) -> list[ProductoRead]:
        with self.uow as uow:
            return a_respuestas(uow, uow.productos.listar(categoria_id, solo_disponibles))

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return a_respuestas(uow, [self._obtener(uow, producto_id)])[0]

    def crear(self, datos: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            producto = uow.productos.create(
                Producto(**datos.model_dump(exclude={"categoria_ids", "ingrediente_ids"}))
            )
            # Si una categoría o un ingrediente no existe se lanza 404
            # y el Unit of Work hace rollback también del producto
            self._asignar_categorias(uow, producto.id, datos.categoria_ids)  # type: ignore[arg-type]
            self._asignar_ingredientes(uow, producto.id, datos.ingrediente_ids)  # type: ignore[arg-type]
            return a_respuestas(uow, [producto])[0]

    def actualizar(self, producto_id: int, datos: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener(uow, producto_id)
            cambios = datos.model_dump(exclude_unset=True, exclude_none=True)
            categoria_ids = cambios.pop("categoria_ids", None)
            ingrediente_ids = cambios.pop("ingrediente_ids", None)
            producto = uow.productos.update(producto, cambios)
            if categoria_ids is not None:
                self._asignar_categorias(uow, producto_id, categoria_ids)
            if ingrediente_ids is not None:
                self._asignar_ingredientes(uow, producto_id, ingrediente_ids)
            return a_respuestas(uow, [producto])[0]

    def eliminar(self, producto_id: int) -> None:
        with self.uow as uow:
            uow.productos.soft_delete(self._obtener(uow, producto_id))


class ProductoCategoriaService:
    """Gestiona la tabla de enlace Producto <-> Categoria (con borrado lógico).

    - Un producto tiene como máximo UNA categoría principal.
    - La primera categoría que se asocia queda como principal.
    - Un producto debe conservar al menos una categoría (multiplicidad 1..*).
    """

    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _quitar_principal(uow: ProductoUnitOfWork, producto_id: int) -> None:
        for v in uow.vinculos.de_producto(producto_id):
            if v.es_principal:
                uow.vinculos.update(v, {"es_principal": False})

    @staticmethod
    def _vinculo(uow: ProductoUnitOfWork, producto_id: int, categoria_id: int) -> ProductoCategoria:
        vinculo = uow.vinculos.obtener(producto_id, categoria_id)
        if vinculo is None:
            raise VinculoNoEncontrado(producto_id, categoria_id)
        return vinculo

    def listar(self, producto_id: int) -> list[ProductoCategoriaRead]:
        with self.uow as uow:
            ProductoService._obtener(uow, producto_id)
            return [
                ProductoCategoriaRead.model_validate(v)
                for v in uow.vinculos.de_producto(producto_id)
            ]

    def asociar(self, producto_id: int, datos: ProductoCategoriaCreate) -> ProductoCategoriaRead:
        with self.uow as uow:
            ProductoService._obtener(uow, producto_id)
            if uow.categorias.get_by_id(datos.categoria_id) is None:
                raise CategoriaNoEncontrada(datos.categoria_id)
            if uow.vinculos.obtener(producto_id, datos.categoria_id) is not None:
                raise ConflictoNegocio("La categoría ya está asociada a este producto")

            es_principal = datos.es_principal or not uow.vinculos.de_producto(producto_id)
            if es_principal:
                self._quitar_principal(uow, producto_id)
            borrado = uow.vinculos.obtener_incluso_borrado(producto_id, datos.categoria_id)
            if borrado is not None:
                # El vínculo existió y se había desasociado: se reactiva
                vinculo = uow.vinculos.update(
                    borrado, {"deleted_at": None, "es_principal": es_principal}
                )
            else:
                vinculo = uow.vinculos.create(
                    ProductoCategoria(
                        producto_id=producto_id,
                        categoria_id=datos.categoria_id,
                        es_principal=es_principal,
                    )
                )
            return ProductoCategoriaRead.model_validate(vinculo)

    def actualizar(
        self, producto_id: int, categoria_id: int, datos: ProductoCategoriaUpdate
    ) -> ProductoCategoriaRead:
        with self.uow as uow:
            vinculo = self._vinculo(uow, producto_id, categoria_id)
            if datos.es_principal:
                self._quitar_principal(uow, producto_id)
            elif vinculo.es_principal:
                raise ConflictoNegocio(
                    "Marcá otra categoría como principal en lugar de desmarcar ésta"
                )
            vinculo = uow.vinculos.update(vinculo, {"es_principal": datos.es_principal})
            return ProductoCategoriaRead.model_validate(vinculo)

    def desasociar(self, producto_id: int, categoria_id: int) -> None:
        """Borrado lógico del vínculo."""
        with self.uow as uow:
            vinculo = self._vinculo(uow, producto_id, categoria_id)
            restantes = [
                v for v in uow.vinculos.de_producto(producto_id) if v.categoria_id != categoria_id
            ]
            if not restantes:
                raise ConflictoNegocio("El producto debe conservar al menos una categoría")
            era_principal = vinculo.es_principal
            uow.vinculos.update(vinculo, {"es_principal": False})
            uow.vinculos.soft_delete(vinculo)
            if era_principal:
                uow.vinculos.update(restantes[0], {"es_principal": True})
