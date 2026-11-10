"""Engine de SQLModel y creación de tablas."""

from datetime import datetime, timezone

from sqlmodel import SQLModel, create_engine

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=settings.SQL_ECHO)


def ahora() -> datetime:
    """Fecha y hora actual en UTC (para columnas TIMESTAMPTZ)."""
    return datetime.now(timezone.utc)


def create_db_and_tables() -> None:
    # Importar los modelos para que queden registrados en la metadata
    from app.modules.categorias import models as _categorias  # noqa: F401
    from app.modules.estados_pedido import models as _estados  # noqa: F401
    from app.modules.ingredientes import models as _ingredientes  # noqa: F401
    from app.modules.pedidos import models as _pedidos  # noqa: F401
    from app.modules.productos import models as _productos  # noqa: F401
    from app.modules.usuarios import models as _usuarios  # noqa: F401

    SQLModel.metadata.create_all(engine)
