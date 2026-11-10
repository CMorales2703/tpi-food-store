from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

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
# RN-09: mínimo 8 caracteres. bcrypt sólo usa los primeros 72 bytes: se limita ahí.
Password = Annotated[str, Field(min_length=8, max_length=72)]


class UserCreate(BaseModel):
    """Datos del registro público (POST /auth/register). El rol no se recibe: siempre es user."""

    username: Username
    full_name: NombreCompleto
    email: EmailStr  # RN-09: email inválido → 422
    password: Password


class UserPublic(BaseModel):
    """Datos que se devuelven del usuario: nunca incluye la contraseña ni su hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    email: str
    role: Rol
    disabled: bool
    created_at: datetime


class MensajeRespuesta(BaseModel):
    detail: str
