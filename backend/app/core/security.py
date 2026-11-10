"""Hash de contraseñas (bcrypt) y emisión / validación del JWT."""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings


# ---------- Contraseñas (RN-01: nunca en texto plano) ----------
def hash_password(password: str) -> str:
    """Devuelve el hash bcrypt (incluye la sal) como texto de 60 caracteres."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


# ---------- JWT ----------
def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    """Firma un JWT con el username en `sub` y vencimiento en `exp`."""
    ahora = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": ahora,
        "exp": ahora + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        **(extra or {}),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Valida firma y vencimiento. Lanza jwt.PyJWTError si el token no es válido."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
