"""Schemas de usuario (SQLModel sin table=True): entrada del registro y salida pública."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import EmailStr, StringConstraints
from sqlmodel import Field, SQLModel

Rol = Literal["user", "admin"]

Username = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$"
    ),
]
NombreCompleto = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class UserCreate(SQLModel):
    """Registro público (POST /auth/register). El rol no se recibe: siempre es "user"."""

    username: Username
    full_name: NombreCompleto
    email: EmailStr  # email inválido → 422
    # Mínimo 8 caracteres. bcrypt solo usa los primeros 72 bytes: se limita ahí.
    password: str = Field(min_length=8, max_length=72)


class UserPublic(SQLModel):
    """Datos que se devuelven de un usuario: NUNCA incluye hashed_password."""

    id: int
    username: str
    full_name: str
    email: str
    role: Rol
    disabled: bool
    created_at: datetime
