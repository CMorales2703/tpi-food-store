"""Configuración de la aplicación leída desde variables de entorno (.env).

El .env NO se entrega: se incluye .env.example con marcadores.
"""

import os

from dotenv import load_dotenv

load_dotenv()


def _requerida(nombre: str) -> str:
    valor = os.getenv(nombre, "").strip()
    if not valor:
        raise RuntimeError(
            f"Falta la variable de entorno {nombre}. Copiá .env.example a .env y completala."
        )
    return valor


class Settings:
    # Base de datos (la contraseña va dentro de la URL)
    DATABASE_URL: str = _requerida("DATABASE_URL")
    SQL_ECHO: bool = os.getenv("SQL_ECHO", "false").lower() == "true"

    # JWT
    SECRET_KEY: str = _requerida("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    # Cookie HttpOnly que transporta el JWT
    COOKIE_NAME: str = "access_token"
    # En producción (HTTPS) debe ser true; en localhost con HTTP, false
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    # CORS con credenciales: los orígenes deben ser explícitos (no se admite "*")
    CORS_ORIGINS: list[str] = [
        origen.strip()
        for origen in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origen.strip()
    ]

    # Prefijo de todas las rutas de la API
    API_PREFIX: str = "/api/v1"


settings = Settings()
