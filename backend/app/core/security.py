"""Hash de contraseñas (passlib + bcrypt) y emisión / validación del JWT (python-jose)."""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# CryptContext elige el algoritmo y guarda en el hash su identificador y la sal.
# deprecated="auto": si en el futuro se agrega otro esquema, los hashes viejos
# se marcan para regenerarse. Requiere bcrypt==4.0.1 (passlib 1.7.4 falla con bcrypt 5).
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------- Contraseñas: nunca se guardan en texto plano ----------
def hash_password(password: str) -> str:
    """Devuelve el hash bcrypt (60 caracteres, incluye la sal)."""
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


# ---------- JWT ----------
def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    """Firma un JWT con el username en `sub` y el vencimiento en `exp`."""
    emitido = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": emitido,
        "exp": emitido + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        **(extra or {}),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Valida firma y vencimiento.

    Lanza jose.ExpiredSignatureError si venció y jose.JWTError (su clase base)
    si el token es inválido por cualquier otro motivo.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
