"""Carga inicial de datos.

Uso (desde la carpeta backend, con el entorno virtual activo):
    python seed.py

1. Catálogo EstadoPedido (RN-06): la API sólo lo expone por GET, así que se carga acá.
2. Usuario administrador, con los datos ADMIN_* del .env (el registro público
   siempre crea usuarios con rol user, así que el primer admin sale de este script).
3. Datos de prueba del catálogo (categorías, ingredientes, productos y 2 pedidos),
   sólo si la base todavía no tiene categorías.

Se puede ejecutar más de una vez: cada paso verifica qué ya existe.
"""

import os
import sys

from sqlmodel import Session

from app.core.database import create_db_and_tables, engine
from app.modules.categorias.schemas import CategoriaCreate
from app.modules.categorias.service import CategoriaService
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork
from app.modules.estados_pedido.models import EstadoPedido
from app.modules.ingredientes.schemas import IngredienteCreate
from app.modules.ingredientes.service import IngredienteService
from app.modules.ingredientes.unit_of_work import IngredienteUnitOfWork
from app.modules.pedidos.schemas import DetallePedidoCreate, PedidoCreate, PedidoUpdate
from app.modules.pedidos.service import PedidoService
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.schemas import ProductoCreate
from app.modules.productos.service import ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork
from app.modules.usuarios.schemas import UserCreate
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

# (codigo, descripcion, orden, es_terminal)
ESTADOS_PEDIDO = [
    ("PENDIENTE", "Pedido recibido, pendiente de confirmación", 1, False),
    ("CONFIRMADO", "Pedido confirmado por el local", 2, False),
    ("ENTREGADO", "Pedido entregado al cliente", 3, True),
    ("CANCELADO", "Pedido cancelado", 4, True),
]

CATEGORIAS = [
    ("Pizzas", "Pizzas al molde y a la piedra"),
    ("Empanadas", "Al horno y fritas"),
    ("Bebidas", "Gaseosas, aguas y jugos"),
    ("Postres", "Helados, flanes y tortas"),
    ("Hamburguesas", "Con papas fritas"),
    ("Veggie", "Opciones sin carne"),
]

INGREDIENTES = [
    "Muzzarella",
    "Salsa de tomate",
    "Orégano",
    "Jamón",
    "Morrón",
    "Cebolla",
    "Huevo",
    "Aceitunas",
    "Carne picada",
    "Lechuga",
    "Tomate",
]

# (nombre, descripción, precio, disponible, categorías, ingredientes)
PRODUCTOS = [
    (
        "Pizza Muzzarella",
        "Salsa de tomate, muzzarella y orégano",
        8500,
        True,
        ["Pizzas", "Veggie"],
        ["Muzzarella", "Salsa de tomate", "Orégano", "Aceitunas"],
    ),
    (
        "Pizza Napolitana",
        "Muzzarella, tomate en rodajas y ajo",
        9200,
        True,
        ["Pizzas", "Veggie"],
        ["Muzzarella", "Salsa de tomate", "Tomate"],
    ),
    (
        "Pizza Especial",
        "Muzzarella, jamón y morrón",
        9800,
        True,
        ["Pizzas"],
        ["Muzzarella", "Salsa de tomate", "Jamón", "Morrón"],
    ),
    (
        "Empanada de carne",
        "Carne cortada a cuchillo",
        1300,
        True,
        ["Empanadas"],
        ["Carne picada", "Cebolla", "Huevo", "Aceitunas"],
    ),
    ("Empanada de jamón y queso", None, 1200, True, ["Empanadas"], ["Jamón", "Muzzarella"]),
    (
        "Empanada de verdura",
        "Acelga y salsa blanca",
        1200,
        False,
        ["Empanadas", "Veggie"],
        ["Cebolla"],
    ),
    (
        "Hamburguesa completa",
        "Lechuga, tomate, huevo y jamón",
        7800,
        True,
        ["Hamburguesas"],
        ["Carne picada", "Lechuga", "Tomate", "Huevo", "Jamón"],
    ),
    ("Gaseosa 1,5 L", None, 3200, True, ["Bebidas"], []),
    ("Agua mineral 500 ml", None, 1500, True, ["Bebidas"], []),
    ("Flan con dulce de leche", "Casero", 2800, True, ["Postres"], ["Huevo"]),
]


def cargar_estados_pedido() -> None:
    """Inserta o actualiza el catálogo (idempotente)."""
    with Session(engine) as session:
        for codigo, descripcion, orden, terminal in ESTADOS_PEDIDO:
            session.merge(
                EstadoPedido(
                    codigo=codigo, descripcion=descripcion, orden=orden, es_terminal=terminal
                )
            )
        session.commit()
    print(f"✓ Catálogo EstadoPedido: {len(ESTADOS_PEDIDO)} estados")


def crear_admin():
    """Crea el admin con los datos ADMIN_* del .env si todavía no existe."""
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD", "")
    if len(password) < 8 or password.startswith("REEMPLAZAR"):
        sys.exit(
            "✗ Definí ADMIN_PASSWORD en el .env (mínimo 8 caracteres) antes de ejecutar seed.py"
        )

    with UsuarioUnitOfWork() as uow:
        existente = uow.usuarios.buscar_por_username(username)
    if existente is not None:
        print(f"✓ Usuario admin '{username}' ya existía")
        return existente

    UsuarioService(UsuarioUnitOfWork()).registrar(
        UserCreate(
            username=username,
            full_name=os.getenv("ADMIN_FULL_NAME", "Administrador"),
            email=os.getenv("ADMIN_EMAIL", "admin@foodstore.com"),
            password=password,
        ),
        role="admin",
    )
    print(f"✓ Usuario admin '{username}' creado")
    with UsuarioUnitOfWork() as uow:
        return uow.usuarios.buscar_por_username(username)


def cargar_datos_de_prueba(admin) -> None:
    categorias = CategoriaService(CategoriaUnitOfWork())
    if categorias.listar():
        print("✓ El catálogo ya tenía datos: no se cargaron datos de prueba")
        return

    ids_categoria = {
        c.nombre: c.id
        for c in (categorias.crear(CategoriaCreate(nombre=n, descripcion=d)) for n, d in CATEGORIAS)
    }
    ingredientes = IngredienteService(IngredienteUnitOfWork())
    ids_ingrediente = {
        i.nombre: i.id
        for i in (ingredientes.crear(IngredienteCreate(nombre=n)) for n in INGREDIENTES)
    }

    productos = ProductoService(ProductoUnitOfWork())
    ids_producto = [
        productos.crear(
            ProductoCreate(
                nombre=nombre,
                descripcion=desc,
                precio_base=precio,
                disponible=disp,
                categoria_ids=[ids_categoria[c] for c in cats],
                ingrediente_ids=[ids_ingrediente[i] for i in ings],
            )
        ).id
        for nombre, desc, precio, disp, cats, ings in PRODUCTOS
    ]

    pedidos = PedidoService(PedidoUnitOfWork())
    p1 = pedidos.crear(
        PedidoCreate(
            detalles=[
                DetallePedidoCreate(producto_id=ids_producto[0], cantidad=2),
                DetallePedidoCreate(producto_id=ids_producto[7], cantidad=1),
            ]
        ),
        admin,
    )
    pedidos.actualizar_estado(p1.id, PedidoUpdate(estado="CONFIRMADO"))
    pedidos.crear(
        PedidoCreate(detalles=[DetallePedidoCreate(producto_id=ids_producto[3], cantidad=12)]),
        admin,
    )
    print(
        f"✓ Datos de prueba: {len(CATEGORIAS)} categorías, {len(INGREDIENTES)} ingredientes, "
        f"{len(PRODUCTOS)} productos y 2 pedidos"
    )


def main() -> None:
    create_db_and_tables()
    cargar_estados_pedido()
    admin = crear_admin()
    cargar_datos_de_prueba(admin)


if __name__ == "__main__":
    main()
