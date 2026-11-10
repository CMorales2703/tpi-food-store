from datetime import datetime
from typing import Optional

from sqlalchemy import CheckConstraint, Column, DateTime
from sqlmodel import Field, SQLModel

from app.core.database import ahora

ROLES = ("user", "admin")


class Usuario(SQLModel, table=True):
    """Usuario del sistema. El borrado lógico es el campo `disabled` (RN-11)."""

    __tablename__ = "usuario"
    __table_args__ = (CheckConstraint("role IN ('user', 'admin')", name="ck_usuario_role"),)

    # PK
    id: Optional[int] = Field(default=None, primary_key=True)

    # Datos (RN-02: username y email únicos)
    username: str = Field(max_length=50, unique=True, nullable=False, index=True)
    full_name: str = Field(max_length=100, nullable=False)
    email: str = Field(max_length=254, unique=True, nullable=False, index=True)

    # RN-01: hash bcrypt (60 caracteres), nunca la contraseña en texto plano
    hashed_password: str = Field(max_length=60, nullable=False)

    # Autorización
    role: str = Field(default="user", max_length=20, nullable=False)
    disabled: bool = Field(default=False, nullable=False)

    # Audit
    created_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=ahora, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
