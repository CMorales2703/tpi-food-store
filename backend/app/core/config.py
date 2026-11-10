"""Configuración de la aplicación leída desde variables de entorno (.env).

Se usa pydantic-settings: cada atributo de Settings se completa con la variable
de entorno del mismo nombre (o desde el archivo .env). Pydantic valida los tipos
al arrancar, así que una variable faltante o inválida corta el inicio con un
mensaje claro en lugar de fallar más tarde.

El .env NO se entrega: se incluye .env.example con valores de ejemplo.
"""

from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        # Variables de más en el .env (p. ej. las del TP9) se ignoran en lugar de dar error
        extra="ignore",
    )

    # --- Variables del enunciado ---
    # La contraseña de la base va dentro de la URL. Sin valor por defecto: es obligatoria.
    DATABASE_URL: str
    # Firma del JWT: obligatoria y de al menos 32 caracteres
    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Origen del frontend permitido por CORS (con credenciales no se admite "*")
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # --- Extras (no los pide el enunciado; tienen valores por defecto) ---
    SQL_ECHO: bool = False
    # Cookie HttpOnly que transporta el JWT
    COOKIE_NAME: str = "access_token"
    # En producción (HTTPS) debe ser true; en localhost con HTTP, false
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    # Prefijo de todas las rutas de la API
    API_PREFIX: str = "/api/v1"

    @field_validator("DATABASE_URL")
    @classmethod
    def usar_psycopg2(cls, url: str) -> str:
        """Fuerza el driver psycopg2 para PostgreSQL.

        Desde SQLAlchemy 2.1, una URL `postgresql://` usa por defecto psycopg 3,
        pero el proyecto usa psycopg2-binary (como pide el enunciado). Así la URL
        del enunciado (postgresql://user:pass@localhost:5432/foodstore_db) funciona
        tal cual. Una URL con el driver explícito (postgresql+xxx://) no se toca.
        """
        if url.startswith("postgresql://"):
            return "postgresql+psycopg2://" + url.removeprefix("postgresql://")
        return url


settings = Settings()  # type: ignore[call-arg]  # los valores vienen del entorno
