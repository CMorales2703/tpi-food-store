"""Carga inicial de datos.

Uso (desde la carpeta backend, con el entorno virtual activo):
    python -m app.db.seed

Crea:
  1. El usuario administrador: admin / Admin1234! (rol admin). El registro
     público siempre crea usuarios "user", así que el admin sale de acá.
  2. Categorías y productos con stock para probar el catálogo y los pedidos.

Es IDEMPOTENTE: se puede ejecutar varias veces. Cada registro se busca por su
dato único (username, nombre de categoría, nombre de producto) y solo se crea
si no existe. Lo que ya está en la base NO se modifica (por ejemplo, el stock
que bajó por los pedidos no se vuelve a llenar).

Usa directamente la sesión y los modelos (no los Services) para no depender de
las reglas de la API: es una herramienta de carga, no un caso de uso.
"""

from sqlmodel import Session, func, select

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.db.models import Categoria, Producto, Usuario

ADMIN = {
    "username": "admin",
    "password": "Admin1234!",
    "full_name": "Administrador",
    "email": "admin@foodstore.com",
}

# (nombre, descripción)
CATEGORIAS = [
    ("Pizzas", "Pizzas al molde y a la piedra"),
    ("Empanadas", "Al horno, por unidad"),
    ("Hamburguesas", "Todas con papas fritas"),
    ("Bebidas", "Gaseosas, aguas y cervezas"),
    ("Postres", "Dulces caseros"),
]

# (categoría, nombre, descripción, precio_base, stock, disponible)
PRODUCTOS = [
    ("Pizzas", "Pizza Muzzarella", "Salsa de tomate, muzzarella y orégano", 8500, 20, True),
    ("Pizzas", "Pizza Napolitana", "Muzzarella, tomate en rodajas y ajo", 9200, 15, True),
    ("Pizzas", "Pizza Especial", "Muzzarella, jamón y morrón", 9800, 12, True),
    ("Empanadas", "Empanada de carne", "Carne cortada a cuchillo", 1300, 60, True),
    ("Empanadas", "Empanada de jamón y queso", "Jamón cocido y muzzarella", 1200, 48, True),
    ("Empanadas", "Empanada de verdura", "Acelga y salsa blanca", 1200, 0, False),
    ("Hamburguesas", "Hamburguesa clásica", "Carne, lechuga, tomate y cheddar", 7500, 25, True),
    ("Hamburguesas", "Hamburguesa completa", "Clásica con huevo y panceta", 8900, 18, True),
    ("Bebidas", "Gaseosa 1,5 L", "Cola, lima-limón o naranja", 3200, 40, True),
    ("Bebidas", "Agua mineral 500 ml", "Con o sin gas", 1500, 50, True),
    ("Bebidas", "Cerveza artesanal 500 ml", "Rubia o roja", 3800, 3, True),
    ("Postres", "Flan con dulce de leche", "Casero", 2800, 10, True),
    ("Postres", "Tiramisú", "Porción individual", 4200, 8, True),
]


def _crear_admin(session: Session) -> bool:
    existe = session.exec(
        select(Usuario).where(func.lower(Usuario.username) == ADMIN["username"])
    ).first()
    if existe is not None:
        return False
    session.add(
        Usuario(
            username=ADMIN["username"],
            full_name=ADMIN["full_name"],
            email=ADMIN["email"],
            hashed_password=hash_password(ADMIN["password"]),
            role="admin",
        )
    )
    return True


def _crear_categorias(session: Session) -> dict[str, Categoria]:
    """Devuelve todas las categorías del seed por nombre (las existentes y las nuevas)."""
    por_nombre: dict[str, Categoria] = {}
    for nombre, descripcion in CATEGORIAS:
        categoria = session.exec(
            select(Categoria).where(func.lower(Categoria.nombre) == nombre.lower())
        ).first()
        if categoria is None:
            categoria = Categoria(nombre=nombre, descripcion=descripcion)
            session.add(categoria)
            session.flush()  # para tener el id antes de crear sus productos
        por_nombre[nombre] = categoria
    return por_nombre


def _crear_productos(session: Session, categorias: dict[str, Categoria]) -> int:
    creados = 0
    for categoria, nombre, descripcion, precio, stock, disponible in PRODUCTOS:
        existe = session.exec(
            select(Producto).where(func.lower(Producto.nombre) == nombre.lower())
        ).first()
        if existe is not None:
            continue
        session.add(
            Producto(
                categoria_id=categorias[categoria].id,
                nombre=nombre,
                descripcion=descripcion,
                precio_base=precio,
                stock=stock,
                disponible=disponible,
            )
        )
        creados += 1
    return creados


def main() -> None:
    create_all_tables()
    # Una sola transacción: si algo falla, no queda nada a medias
    with session_factory() as session:
        admin_creado = _crear_admin(session)
        categorias = _crear_categorias(session)
        productos_creados = _crear_productos(session, categorias)
        session.commit()

    print(
        f"✓ Usuario admin: {'creado' if admin_creado else 'ya existía'} "
        f"(usuario: {ADMIN['username']} / contraseña: {ADMIN['password']})"
    )
    print(f"✓ Categorías: {len(categorias)} en el seed")
    print(f"✓ Productos nuevos: {productos_creados} (de {len(PRODUCTOS)} en el seed)")


if __name__ == "__main__":
    main()
