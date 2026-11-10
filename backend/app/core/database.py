"""Engine de SQLModel, fábrica de sesiones y creación de tablas."""

from datetime import datetime, timezone

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# SQLite (solo desarrollo) por defecto rechaza usar una conexión desde otro hilo,
# y FastAPI atiende los endpoints síncronos en un pool de hilos.
_connect_args = (
    {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(settings.DATABASE_URL, echo=settings.SQL_ECHO, connect_args=_connect_args)


def session_factory() -> Session:
    """Crea una sesión nueva. La usa el Unit of Work en __enter__.

    expire_on_commit=False: los objetos siguen legibles después del commit
    (sin volver a consultar la base).
    """
    return Session(engine, expire_on_commit=False)


def ahora() -> datetime:
    """Fecha y hora actual en UTC (para las columnas de fecha)."""
    return datetime.now(timezone.utc)


def create_all_tables() -> None:
    """Crea las tablas que falten (no modifica las existentes)."""
    # Importar los modelos para que queden registrados en la metadata.
    # Transitorio (Fase 1, paso 1): categorias, productos y pedidos se vuelven
    # a registrar en el paso 2, cuando se reescriben sus modelos según el UML.
    from app.modules.usuarios import models as _usuarios  # noqa: F401

    SQLModel.metadata.create_all(engine)
