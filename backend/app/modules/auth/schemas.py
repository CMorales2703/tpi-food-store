"""Schemas propios de auth. El registro y el perfil usan los de usuarios (UserCreate, UserPublic)."""

from sqlmodel import SQLModel


class MensajeRespuesta(SQLModel):
    """Respuesta de login y logout. El JWT NUNCA va en el cuerpo: viaja en la cookie."""

    message: str
