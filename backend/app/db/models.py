"""Registro de todos los modelos de tabla.

Las relaciones se declaran con el nombre de la clase como texto ("Pedido",
"Producto", ...) para evitar importaciones circulares entre módulos. SQLAlchemy
resuelve esos nombres la primera vez que usa un modelo, y para eso TODAS las
clases tienen que estar importadas. Este archivo las importa juntas; lo usan
create_all_tables (al arrancar la app) y el seed.
"""

from app.modules.categorias.models import Categoria
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

__all__ = ["Categoria", "DetallePedido", "Pedido", "Producto", "Usuario"]
