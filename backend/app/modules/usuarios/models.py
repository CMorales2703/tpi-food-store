"""Modelo Usuario (paquete Usuarios del UML)."""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.core.database import ahora

if TYPE_CHECKING:  # solo para el tipado: evita la importación circular en ejecución
    from app.modules.pedidos.models import Pedido

ROLES = ("user", "admin")


class Usuario(SQLModel, table=True):
    """Usuario del sistema.

    El registro público crea usuarios con rol "user"; el admin sale del seed.
    Baja lógica con `disabled` (el admin activa / desactiva).
    """

    __tablename__ = "usuario"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(max_length=50, unique=True, index=True)
    full_name: str = Field(max_length=100)
    email: str = Field(max_length=254, unique=True, index=True)
    # Hash bcrypt (60 caracteres): la contraseña nunca se guarda en texto plano
    hashed_password: str = Field(max_length=60)
    role: str = Field(default="user", max_length=20)  # "user" | "admin"
    disabled: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    # Usuario 1:N Pedido
    pedidos: list["Pedido"] = Relationship(back_populates="usuario")
