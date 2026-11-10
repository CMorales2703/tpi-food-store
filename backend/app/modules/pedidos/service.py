from app.core.exceptions import ConflictoNegocio, DatosInvalidos, RecursoNoEncontrado
from app.modules.pedidos.models import ESTADO_INICIAL, DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    DetallePedidoRead,
    PedidoCreate,
    PedidoRead,
    PedidoUpdate,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.models import Usuario


class PedidoNoEncontrado(RecursoNoEncontrado):
    def __init__(self, pedido_id: int) -> None:
        super().__init__(f"Pedido {pedido_id} no encontrado")


class ProductoNoEncontrado(RecursoNoEncontrado):
    def __init__(self, producto_id: int) -> None:
        super().__init__(f"Producto {producto_id} no encontrado")


class PedidoEnEstadoTerminal(ConflictoNegocio):
    def __init__(self, estado: str) -> None:
        super().__init__(f"El pedido está {estado}: su estado ya no puede cambiar")


class CatalogoSinCargar(ConflictoNegocio):
    def __init__(self) -> None:
        super().__init__("Falta cargar el catálogo de estados de pedido: ejecutá python seed.py")


def a_respuesta(pedido: Pedido) -> PedidoRead:
    return PedidoRead(
        id=pedido.id,  # type: ignore[arg-type]
        usuario_id=pedido.usuario_id,
        username=pedido.usuario.username if pedido.usuario else "",
        fecha=pedido.fecha,
        estado=pedido.estado,
        total=pedido.total,
        detalles=[
            DetallePedidoRead(
                producto_id=d.producto_id,
                nombre_producto=d.producto.nombre if d.producto else "",
                cantidad=d.cantidad,
                precio_unitario=d.precio_unitario,
            )
            for d in pedido.detalles
        ],
    )


def es_admin(usuario: Usuario) -> bool:
    return usuario.role == "admin"


class PedidoService:
    """Casos de uso de Pedido. Cada uno se ejecuta dentro del Unit of Work.

    Visibilidad: un user sólo ve y consulta sus pedidos; un admin, todos.
    """

    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _obtener(uow: PedidoUnitOfWork, pedido_id: int, usuario: Usuario | None = None) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(pedido_id)  # inexistente o eliminado
        # Un user no puede ver pedidos ajenos: se responde 404 para no revelar que existen
        if usuario is not None and not es_admin(usuario) and pedido.usuario_id != usuario.id:
            raise PedidoNoEncontrado(pedido_id)
        return pedido

    def listar(self, usuario: Usuario) -> list[PedidoRead]:
        with self.uow as uow:
            filtro = None if es_admin(usuario) else usuario.id
            return [a_respuesta(p) for p in uow.pedidos.listar(usuario_id=filtro)]

    def obtener(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            return a_respuesta(self._obtener(uow, pedido_id, usuario))

    def crear(self, data: PedidoCreate, usuario: Usuario) -> PedidoRead:
        """Alta atómica: el pedido y sus detalles se guardan juntos.
        Si un detalle referencia un producto inexistente se lanza la excepción,
        el Unit of Work hace rollback y tampoco queda guardado el pedido."""
        with self.uow as uow:
            if uow.estados.obtener(ESTADO_INICIAL) is None:
                raise CatalogoSinCargar()
            # create() hace flush: pedido.id ya está disponible para los detalles
            pedido = uow.pedidos.create(
                Pedido(usuario_id=usuario.id, estado=ESTADO_INICIAL, total=0)  # type: ignore[arg-type]
            )
            total = 0.0
            for item in data.detalles:
                producto = uow.productos.get_by_id(item.producto_id)
                if producto is None:
                    raise ProductoNoEncontrado(item.producto_id)
                precio = float(producto.precio_base)  # snapshot del precio actual
                uow.detalles.create(
                    DetallePedido(
                        pedido_id=pedido.id,  # type: ignore[arg-type]
                        producto_id=producto.id,  # type: ignore[arg-type]
                        cantidad=item.cantidad,
                        precio_unitario=precio,
                    )
                )
                total += item.cantidad * precio
            pedido = uow.pedidos.update(pedido, {"total": round(total, 2)})
            uow.pedidos.refrescar(pedido)  # carga los detalles recién creados
            return a_respuesta(pedido)

    def actualizar_estado(self, pedido_id: int, data: PedidoUpdate) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            nuevo = uow.estados.obtener(data.estado)
            if nuevo is None:
                validos = ", ".join(e.codigo for e in uow.estados.listar())
                raise DatosInvalidos(
                    f"Estado '{data.estado}' inválido. Valores permitidos: {validos}"
                )
            actual = uow.estados.obtener(pedido.estado)
            # ENTREGADO y CANCELADO son terminales (es_terminal en el catálogo) → 409
            if actual is not None and actual.es_terminal and nuevo.codigo != actual.codigo:
                raise PedidoEnEstadoTerminal(actual.codigo)
            pedido = uow.pedidos.update(pedido, {"estado": nuevo.codigo})
            return a_respuesta(pedido)

    def eliminar(self, pedido_id: int) -> None:
        """Borrado lógico: completa deleted_at. Los detalles se conservan."""
        with self.uow as uow:
            uow.pedidos.soft_delete(self._obtener(uow, pedido_id))
