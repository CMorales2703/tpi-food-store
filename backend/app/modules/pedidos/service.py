"""Reglas de negocio de pedidos (RN-01 a RN-06).

Todo caso de uso abre `with self.uow as uow:`. Si se lanza cualquier excepción
dentro del bloque, el Unit of Work hace rollback: no se persiste nada, tampoco
el stock descontado o restituido hasta ese momento.
"""

from datetime import datetime
from typing import Optional

from app.core.exceptions import AccesoDenegado, DominioError, RecursoNoEncontrado
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.models import Usuario

# RN-02: máquina de estados. Un estado terminal no tiene transiciones.
TRANSICIONES: dict[str, set[str]] = {
    "PENDIENTE": {"EN_PREPARACION", "CANCELADO"},
    "EN_PREPARACION": {"ENTREGADO", "CANCELADO"},
    "ENTREGADO": set(),
    "CANCELADO": set(),
}


# ---------- Excepciones de dominio ----------
class PedidoNoEncontrado(RecursoNoEncontrado):  # 404
    def __init__(self, pedido_id: int) -> None:
        super().__init__(f"Pedido {pedido_id} no encontrado")


class PedidoAjeno(AccesoDenegado):  # 403
    def __init__(self, pedido_id: int) -> None:
        super().__init__(f"El pedido {pedido_id} pertenece a otro usuario")


class ProductoNoDisponible(DominioError):  # 400
    def __init__(self, nombre: str) -> None:
        super().__init__(f"El producto '{nombre}' no está disponible")


class StockInsuficiente(DominioError):  # 400
    def __init__(self, nombre: str, stock: int, pedido: int) -> None:
        super().__init__(
            f"Stock insuficiente de '{nombre}': hay {stock} y se pidieron {pedido}"
        )


class ProductoRepetido(DominioError):  # 400
    def __init__(self) -> None:
        super().__init__("Un producto no puede repetirse en el pedido: sumá las cantidades")


class TransicionInvalida(DominioError):  # 400
    def __init__(self, actual: str, nuevo: str) -> None:
        super().__init__(f"No se puede pasar un pedido de {actual} a {nuevo}")


class PedidoNoCancelable(DominioError):  # 400
    def __init__(self, estado: str) -> None:
        super().__init__(f"Solo se puede cancelar un pedido PENDIENTE (está {estado})")


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # ---------- RN-01: crear ----------
    def crear(self, datos: PedidoCreate, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            ids = [item.producto_id for item in datos.items]
            if len(ids) != len(set(ids)):
                raise ProductoRepetido()

            # El pedido se arma completo en memoria y se inserta una sola vez al final
            pedido = Pedido(
                usuario_id=usuario.id,  # type: ignore[arg-type]
                estado="PENDIENTE",
                forma_pago=datos.forma_pago,
                direccion_entrega=datos.direccion_entrega,
                notas=datos.notas,
                total=0,
            )

            total = 0.0
            for item in datos.items:
                producto = uow.productos.get_by_id_for_update(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(item.producto_id)  # 404
                if not producto.disponible:
                    raise ProductoNoDisponible(producto.nombre)
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(producto.nombre, producto.stock, item.cantidad)

                producto.stock -= item.cantidad
                subtotal = round(producto.precio_base * item.cantidad, 2)
                # RN-05: la línea COPIA nombre y precio; si el producto cambia, el pedido no
                pedido.items.append(
                    DetallePedido(
                        producto_id=producto.id,  # type: ignore[arg-type]
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            # INSERT del pedido y (por cascade) de sus líneas; el commit lo hace el UoW
            uow.pedidos.add(pedido)
            return PedidoRead.model_validate(pedido)

    # ---------- Lecturas (RN-04) ----------
    def listar(
        self, usuario: Usuario, skip: int, limit: int, estado: Optional[str]
    ) -> PedidosPaginados:
        """El admin ve todos; el user, solo los suyos."""
        filtro_usuario = None if usuario.role == "admin" else usuario.id
        with self.uow as uow:
            total, pedidos = uow.pedidos.list_by_usuario(filtro_usuario, skip, limit, estado)
            return PedidosPaginados(
                total=total, items=[PedidoRead.model_validate(p) for p in pedidos]
            )

    def obtener(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno(pedido_id)
            return PedidoRead.model_validate(pedido)

    # ---------- RN-02 / RN-03: cambio de estado (admin) ----------
    def cambiar_estado(self, pedido_id: int, nuevo: str) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            # Se valida ANTES de modificar nada
            if nuevo not in TRANSICIONES[pedido.estado]:
                raise TransicionInvalida(pedido.estado, nuevo)
            if nuevo == "CANCELADO":
                self._restituir_stock(uow, pedido)
            pedido.estado = nuevo
            uow.pedidos.guardar(pedido)
            return PedidoRead.model_validate(pedido)

    # ---------- RN-03 / RN-04: cancelación por el dueño ----------
    def cancelar(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno(pedido_id)
            if pedido.estado != "PENDIENTE":
                raise PedidoNoCancelable(pedido.estado)
            self._restituir_stock(uow, pedido)
            pedido.estado = "CANCELADO"
            uow.pedidos.guardar(pedido)
            return PedidoRead.model_validate(pedido)

    # ---------- Resumen del panel ----------
    def resumen(self) -> ResumenPedidos:
        # "Hoy" según la zona horaria del servidor, desde las 00:00
        inicio_hoy = datetime.now().astimezone().replace(hour=0, minute=0, second=0, microsecond=0)
        with self.uow as uow:
            conteo = uow.pedidos.count_by_estado()
            return ResumenPedidos(
                pendientes=conteo.get("PENDIENTE", 0),
                en_preparacion=conteo.get("EN_PREPARACION", 0),
                entregados=conteo.get("ENTREGADO", 0),
                cancelados=conteo.get("CANCELADO", 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_hoy),
                ingresos_entregados=round(uow.pedidos.sum_total_by_estado("ENTREGADO"), 2),
            )

    # ---------- Auxiliares ----------
    @staticmethod
    def _obtener(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_con_items(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(pedido_id)
        return pedido

    @staticmethod
    def _restituir_stock(uow: PedidoUnitOfWork, pedido: Pedido) -> None:
        """RN-03: devuelve al stock la cantidad de cada línea, en la misma transacción
        que cambia el estado. Se restituye aunque el producto esté dado de baja."""
        for item in pedido.items:
            producto = uow.productos.get_by_id_for_update(item.producto_id)
            if producto is not None:
                producto.stock += item.cantidad
